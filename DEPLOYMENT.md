# Deployment Guide

This app has two parts:

- **Frontend:** the Next.js website people open in their browser.
- **Backend:** the Flask API that stores users and countdowns in SQLite.

GitHub stores the code, but GitHub does not run the app. To make the app public, deploy both parts:

- Deploy the **frontend** to Vercel.
- Deploy the **backend** to PythonAnywhere.

The public flow will be:

```text
User opens Vercel website
  -> Vercel forwards /api requests to Flask
  -> Flask reads and writes countdowns.db on PythonAnywhere
```

## 1. Deploy The Backend On PythonAnywhere

1. Create a PythonAnywhere account.
2. Open a **Bash console** on PythonAnywhere.
3. Clone the repo:

```bash
git clone https://github.com/lucas-dbck/Countdown-app.git
cd Countdown-app
```

4. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

5. Create a secret key:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the printed value. You will use it in the WSGI file.

6. Go to the PythonAnywhere **Web** tab.
7. Click **Add a new web app**.
8. Choose your domain, then choose **Manual configuration** or **Flask**.
9. Set the source code path to:

```text
/home/YOUR_USERNAME/Countdown-app
```

10. Set the virtualenv path to:

```text
/home/YOUR_USERNAME/Countdown-app/.venv
```

11. Open the WSGI file from the Web tab and replace its contents with:

```python
import os
import sys

path = "/home/YOUR_USERNAME/Countdown-app"
if path not in sys.path:
    sys.path.append(path)

os.environ["SECRET_KEY"] = "PASTE_THE_SECRET_KEY_HERE"
os.environ["SESSION_COOKIE_SECURE"] = "true"

from app import app as application
```

Replace `YOUR_USERNAME` and `PASTE_THE_SECRET_KEY_HERE`.

12. Click **Reload** on the PythonAnywhere Web tab.
13. Test the backend in your browser:

```text
https://YOUR_USERNAME.pythonanywhere.com/api/me
```

You should see:

```json
{"user": null}
```

## 2. Deploy The Frontend On Vercel

1. Open Vercel.
2. Import this GitHub repository:

```text
lucas-dbck/Countdown-app
```

3. In the Vercel project settings, add this environment variable:

```text
FLASK_API_URL=https://YOUR_USERNAME.pythonanywhere.com
```

4. Deploy the app.
5. Open the Vercel URL.
6. Create an account and add a countdown.

Do not set `NEXT_PUBLIC_API_BASE_URL` for this deployment. The app should call `/api/...` on Vercel, and Vercel will forward those API requests to Flask.

## 3. Where Data Is Stored

User accounts and countdowns are stored in this file on PythonAnywhere:

```text
countdowns.db
```

Each user gets their own countdowns because the backend stores a `user_id` with every countdown.

## 4. Updating The Deployed App Later

When you change code and merge it into GitHub:

1. Vercel usually redeploys the frontend automatically.
2. For PythonAnywhere, open a Bash console:

```bash
cd Countdown-app
git pull
source .venv/bin/activate
pip install -r requirements.txt
```

Then click **Reload** on the PythonAnywhere Web tab.

## 5. Important Notes

- GitHub stores code.
- Vercel runs the website.
- PythonAnywhere runs Flask and stores the SQLite database file.
- Visitors do not need PowerShell.
- Only the person deploying the app needs to do these setup steps.
