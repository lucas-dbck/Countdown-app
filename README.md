# v0-countdown-timers-app

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0](https://v0.app/chat/projects/prj_dndaznpRkKYgEBMtQcxulQWAt5uR)

## Getting Started

First, install the Python backend dependency and start Flask:

```bash
python -m pip install -r requirements.txt
python app.py
```

Then, in another terminal, run the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The frontend calls `/api/countdowns`, and Next.js proxies those requests to Flask at `http://127.0.0.1:5000` by default. Set `FLASK_API_URL` if your Flask server runs somewhere else.

## Accounts

The app has email/password accounts. Each countdown belongs to the logged-in user, so different users see different countdown lists.

For local development, Flask uses a simple default session secret. Before deploying online, set a real `SECRET_KEY` environment variable for the Flask backend.

If the frontend and backend are hosted on different domains, set `FRONTEND_ORIGINS` on the Flask backend to the frontend URL. For HTTPS cross-domain cookies, also set:

```bash
SESSION_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=true
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
