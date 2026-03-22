# Skill Exchange Platform — MERN Scaffold

This repository was converted to a minimal MERN backend scaffold with JWT auth and APIs for chat and teams.

Quick start:

1. Install dependencies

```bash
npm install
```

2. Set up environment (copy `.env.example` to `.env` and edit)

3. Start MongoDB locally (or use Atlas) and run the server

```bash
npm run dev
```

4. Open the frontend in browser (the server serves static files) e.g. `http://localhost:5000/login.html`

Notes:
- Frontend files are unchanged in layout but some JS now imports `js/auth.js` which can be adapted to call `/api/auth` endpoints.
- Use the APIs under `/api/auth`, `/api/chat`, `/api/teams`.

Firebase + Vercel deployment (recommended for static hosting + cloud DB):

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password) and **Firestore Database** (in test or production mode with proper rules).
3. In your Firebase project settings, copy the web app config and update `js/firebase-init.js` (replace `YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc.).
4. Locally test the frontend — the app will use Firebase Auth/Firestore where available and fall back to localStorage or the Node API if present.
5. Push the repository to GitHub.
6. On Vercel, import the GitHub repo and set the root to the project root so `login.html` is served. For static site, Vercel will serve your files directly.
7. Optionally configure Vercel Environment Variables for any secrets (e.g. server-side Firebase admin keys) if you add serverless functions.

Code changes made for Firebase compatibility:
- `js/firebase-init.js` added — put your Firebase config there.
- `index.html` now loads Firebase SDKs and `js/firebase-init.js`.
- `js/auth.js` now prefers Firebase Auth/Firestore for register/login and falls back to the Express API or localStorage.
- `js/chat.js` will load conversations from Firestore when available, and send messages via the Express API or Firestore depending on availability.

If you'd like, I can now fully convert backend usage to client-side Firestore calls (remove Express) or implement serverless API routes on Vercel that use Firebase Admin SDK. Tell me which you prefer.
