# Deployment Guide — SmartCare (Frontend + Backend on Vercel)

This guide shows the manual steps to deploy the frontend (Vite React) and backend (FastAPI) as two separate Vercel projects from the same repository (monorepo).

Prerequisites
- A Vercel account (free tier)
- Vercel CLI (optional) — `npm i -g vercel`
- Supabase project (Postgres + Realtime) with connection string and anon key

Overview
- Frontend project: deploy from repository root (Vite app)
- Backend project: deploy from `smartcare-backend` directory using the Python runtime (`app/main.py`)

Backend (smartcare-backend) — Vercel setup

1. In Vercel, create a new Project → Import Git Repository.
2. When prompted for the Root Directory, set: `smartcare-backend`.
3. Vercel will detect a Python project. Ensure `vercel.json` exists in `smartcare-backend` (it routes everything to `app/main.py`).
4. Under Project Settings → Environment Variables, add the following (see table below).
5. Deploy. Vercel will build using `@vercel/python` and route requests to the `app` object in `app/main.py`.

Frontend (smartcare) — Vercel setup

1. In Vercel, create another Project → Import the same Git Repository.
2. Set the Root Directory to the repository root (or `.`) so the Vite app is built.
3. Under Project Settings → Environment Variables, add the frontend env variables (see table below).
4. In the Frontend Project, set `VITE_API_URL` to the backend URL you receive after the backend deploy (e.g., `https://smartcare-backend-xxxxx.vercel.app`).
5. Deploy the frontend project.

Optional: Vercel CLI (quick env var example)

```bash
# set an env var for the backend project (run from repo, choose appropriate project)
vercel env add DATABASE_URL production
vercel env add SECRET_KEY production
vercel env add ALLOWED_ORIGINS production

# set env vars for the frontend project
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_API_URL production
```

Environment Variables (copy-paste)

**Backend Project (smartcare-backend) Env Vars:**

- `DATABASE_URL`: (My Supabase Connection String)

- `SECRET_KEY`: (Random String)

- `ALLOWED_ORIGINS`: *

**Frontend Project (smartcare-six) Env Vars:**

- `VITE_SUPABASE_URL`: (My Supabase URL)

- `VITE_SUPABASE_ANON_KEY`: (My Supabase Anon Key)

- `VITE_API_URL`: (The URL I get after deploying the backend)

Notes & Best Practices
- Replace `ALLOWED_ORIGINS="*"` with your frontend domain(s) in production for security.
- Keep `SECRET_KEY` secret; use a strong random value (e.g., `openssl rand -hex 32`).
- For database migrations: if you need Alembic, add `alembic` to `requirements.txt` and run migrations as part of a build hook or via a separate CI step.
- If realtime WebRTC signaling uses Supabase Realtime, confirm Realtime is enabled in your Supabase project and the anon key allows channel subscriptions.

Troubleshooting
- If the backend fails to start on Vercel, check Build Logs for missing packages in `requirements.txt`.
- If CORS errors occur, ensure `ALLOWED_ORIGINS` includes your frontend origin.
- If the frontend cannot reach the backend, verify `VITE_API_URL` is set to the deployed backend URL and redeploy the frontend.

Contact
- If you want, I can generate the exact `vercel` CLI commands for your projects and help set the env vars.


## Production Configuration

When deploying to production, ensure the following environment variables are set (concise):

- `VITE_ENABLE_DEMO`: Set to `false` to disable the demo/backdoor behavior in production.
- `TURN_SERVER_URL`: TURN server URL (backend uses this to build ICE/TURN config).
- `TURN_USER`: TURN server username.
- `TURN_PASS`: TURN server password.
- `POSTGRES_USER`: Database username for Postgres (if used instead of SQLite).
- `POSTGRES_PASSWORD`: Database password for Postgres.

Keep credentials secret and provision them via your platform's secure env var store (Vercel, Render, Docker secrets, etc.).

## Production Configuration (Security & Connectivity)

When deploying to Vercel/Render, add these extra variables:

**Backend (smartcare-backend):**
- `VITE_ENABLE_DEMO`: `false` (CRITICAL: Disables the demo123 backdoor)
- `TURN_SERVER_URL`: *(Not required for STUN-only free mode)*
- `TURN_USER`: *(Not required for STUN-only free mode)*
- `TURN_PASS`: *(Not required for STUN-only free mode)*

**Frontend (smartcare):**
- Ensure `VITE_API_URL` points to your production backend (https://your-backend.onrender.com).
