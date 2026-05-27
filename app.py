import os
from pathlib import Path
import sqlite3

from flask import Flask, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash


app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "change-me-before-deploying")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"

DATABASE = Path(__file__).with_name("countdowns.db")
DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get("FRONTEND_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
}


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


def column_exists(table, column):
    rows = get_db().execute(f"PRAGMA table_info({table})").fetchall()
    return any(row["name"] == column for row in rows)


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS countdowns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            emoji TEXT NOT NULL,
            end_date TEXT NOT NULL,
            working_days_only INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )

    if not column_exists("countdowns", "user_id"):
        db.execute("ALTER TABLE countdowns ADD COLUMN user_id INTEGER")

    db.execute("CREATE INDEX IF NOT EXISTS idx_countdowns_user_id ON countdowns (user_id)")
    db.commit()


def row_to_user(row):
    if row is None:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
    }


def row_to_countdown(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "emoji": row["emoji"],
        "end_date": row["end_date"],
        "working_days_only": bool(row["working_days_only"]),
    }


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return get_db().execute(
        "SELECT id, email FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()


def require_user():
    user = get_current_user()
    if user is None:
        return None, (jsonify({"error": "Please log in first"}), 401)
    return user, None


def parse_auth_payload():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if "@" not in email or "." not in email:
        return None, None, "Please enter a valid email address"
    if len(password) < 6:
        return None, None, "Password must be at least 6 characters"

    return email, password, None


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
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


@app.route("/api/register", methods=["POST"])
def register():
    email, password, error = parse_auth_payload()
    if error:
        return jsonify({"error": error}), 400

    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, generate_password_hash(password)),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this email already exists"}), 409

    session["user_id"] = cursor.lastrowid
    user = db.execute(
        "SELECT id, email FROM users WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify({"user": row_to_user(user)}), 201


@app.route("/api/login", methods=["POST"])
def login():
    email, password, error = parse_auth_payload()
    if error:
        return jsonify({"error": error}), 400

    user = get_db().execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Email or password is incorrect"}), 401

    session["user_id"] = user["id"]
    return jsonify({"user": row_to_user(user)})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return "", 204


@app.route("/api/me", methods=["GET"])
def me():
    return jsonify({"user": row_to_user(get_current_user())})


@app.route("/api/countdowns", methods=["GET"])
def get_countdowns():
    user, error_response = require_user()
    if error_response:
        return error_response

    rows = get_db().execute(
        """
        SELECT id, name, emoji, end_date, working_days_only
        FROM countdowns
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user["id"],),
    ).fetchall()
    return jsonify([row_to_countdown(row) for row in rows])


@app.route("/api/countdowns", methods=["POST"])
def create_countdown():
    user, error_response = require_user()
    if error_response:
        return error_response

    data, error = parse_countdown_payload(require_all=True)
    if error:
        return jsonify({"error": error}), 400

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO countdowns (user_id, name, emoji, end_date, working_days_only)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user["id"], data["name"], data["emoji"], data["end_date"], data["working_days_only"]),
    )
    db.commit()

    row = db.execute(
        """
        SELECT id, name, emoji, end_date, working_days_only
        FROM countdowns
        WHERE id = ? AND user_id = ?
        """,
        (cursor.lastrowid, user["id"]),
    ).fetchone()
    return jsonify(row_to_countdown(row)), 201


@app.route("/api/countdowns/<int:countdown_id>", methods=["PUT"])
def update_countdown(countdown_id):
    user, error_response = require_user()
    if error_response:
        return error_response

    data, error = parse_countdown_payload()
    if error:
        return jsonify({"error": error}), 400

    assignments = ", ".join(f"{field} = ?" for field in data)
    values = list(data.values()) + [countdown_id, user["id"]]

    db = get_db()
    cursor = db.execute(
        f"UPDATE countdowns SET {assignments} WHERE id = ? AND user_id = ?",
        values,
    )
    if cursor.rowcount == 0:
        return jsonify({"error": "Countdown not found"}), 404
    db.commit()

    row = db.execute(
        """
        SELECT id, name, emoji, end_date, working_days_only
        FROM countdowns
        WHERE id = ? AND user_id = ?
        """,
        (countdown_id, user["id"]),
    ).fetchone()
    return jsonify(row_to_countdown(row))


@app.route("/api/countdowns/<int:countdown_id>", methods=["DELETE"])
def delete_countdown(countdown_id):
    user, error_response = require_user()
    if error_response:
        return error_response

    db = get_db()
    cursor = db.execute(
        "DELETE FROM countdowns WHERE id = ? AND user_id = ?",
        (countdown_id, user["id"]),
    )
    if cursor.rowcount == 0:
        return jsonify({"error": "Countdown not found"}), 404
    db.commit()
    return "", 204


with app.app_context():
    init_db()


if __name__ == "__main__":
    app.run(debug=True)
