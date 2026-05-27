from pathlib import Path
import sqlite3

from flask import Flask, g, jsonify, request


app = Flask(__name__)
DATABASE = Path(__file__).with_name("countdowns.db")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS countdowns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            emoji TEXT NOT NULL,
            end_date TEXT NOT NULL,
            working_days_only INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    db.commit()


def row_to_countdown(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "emoji": row["emoji"],
        "end_date": row["end_date"],
        "working_days_only": bool(row["working_days_only"]),
    }


def parse_countdown_payload(require_all=False):
    data = request.get_json(silent=True) or {}
    allowed = {}

    for field in ("name", "emoji", "end_date"):
        if field in data:
            value = str(data[field]).strip()
            if not value:
                return None, f"{field} is required"
            allowed[field] = value
        elif require_all:
            return None, f"{field} is required"

    if "working_days_only" in data:
        allowed["working_days_only"] = 1 if bool(data["working_days_only"]) else 0
    elif require_all:
        allowed["working_days_only"] = 0

    if not allowed:
        return None, "No valid countdown fields provided"

    return allowed, None


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


@app.route("/api/countdowns", methods=["GET"])
def get_countdowns():
    rows = get_db().execute(
        """
        SELECT id, name, emoji, end_date, working_days_only
        FROM countdowns
        ORDER BY id DESC
        """
    ).fetchall()
    return jsonify([row_to_countdown(row) for row in rows])


@app.route("/api/countdowns", methods=["POST"])
def create_countdown():
    data, error = parse_countdown_payload(require_all=True)
    if error:
        return jsonify({"error": error}), 400

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO countdowns (name, emoji, end_date, working_days_only)
        VALUES (?, ?, ?, ?)
        """,
        (data["name"], data["emoji"], data["end_date"], data["working_days_only"]),
    )
    db.commit()

    row = db.execute(
        """
        SELECT id, name, emoji, end_date, working_days_only
        FROM countdowns
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify(row_to_countdown(row)), 201


@app.route("/api/countdowns/<int:countdown_id>", methods=["PUT"])
def update_countdown(countdown_id):
    data, error = parse_countdown_payload()
    if error:
        return jsonify({"error": error}), 400

    assignments = ", ".join(f"{field} = ?" for field in data)
    values = list(data.values()) + [countdown_id]

    db = get_db()
    cursor = db.execute(
        f"UPDATE countdowns SET {assignments} WHERE id = ?",
        values,
    )
    if cursor.rowcount == 0:
        return jsonify({"error": "Countdown not found"}), 404
    db.commit()

    row = db.execute(
        """
        SELECT id, name, emoji, end_date, working_days_only
        FROM countdowns
        WHERE id = ?
        """,
        (countdown_id,),
    ).fetchone()
    return jsonify(row_to_countdown(row))


@app.route("/api/countdowns/<int:countdown_id>", methods=["DELETE"])
def delete_countdown(countdown_id):
    db = get_db()
    cursor = db.execute("DELETE FROM countdowns WHERE id = ?", (countdown_id,))
    if cursor.rowcount == 0:
        return jsonify({"error": "Countdown not found"}), 404
    db.commit()
    return "", 204


with app.app_context():
    init_db()


if __name__ == "__main__":
    app.run(debug=True)
