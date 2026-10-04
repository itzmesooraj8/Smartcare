# Render Deployment Parity & Drift Reconciliation Runbook

## Target Service
- **Service Name**: `Smartcare`
- **Render Service ID**: `srv-d4hds9f5r7bs73bpqoag`
- **Component**: Backend FastAPI Web Service

---

## 1. Problem Description (Drift)
The repository has retired Alembic in favor of Supabase migrations. The codebase no longer includes Alembic configuration files or the `alembic` package in `requirements.txt`.
However, the live Render service configuration was previously set to:
```bash
pip install -r requirements.txt && alembic upgrade head
```
If Render attempts to execute this legacy build command on the next deployment, the build will fail with `alembic: command not found`.

---

## 2. Step-by-Step Remediation Procedure

### Option A: Manual Dashboard Update (Fastest)
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Navigate to **Services** -> **Smartcare** (`srv-d4hds9f5r7bs73bpqoag`).
3. Click **Settings** in the left sidebar.
4. Scroll to **Build & Deploy**:
   - **Build Command**: Change from `pip install -r requirements.txt && alembic upgrade head` to:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**: Confirm it remains:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
5. Click **Save Changes**.

### Option B: Infrastructure as Code (Blueprint Sync)
A `render.yaml` specification is committed to the repository root. If the service is linked to the Blueprint, sync the Blueprint to apply the declarative configuration automatically.

---

## 3. Database Credential Transition (`smartcare_backend`)
Once the build command is updated, the database connection string can be transitioned to the least-privilege role:
1. In Render Dashboard -> **Environment**:
2. Update `DATABASE_URL`:
   - Replace administrative role `postgres` with dedicated runtime role `smartcare_backend`.
   - Ensure the password for `smartcare_backend` is properly URL-encoded.
3. Trigger a **Manual Deploy** -> **Clear build cache & deploy**.
4. Verify health check at `https://smartcare-zflo.onrender.com/health` returns `{"status": "healthy"}`.
