# SmartCare Environment Variable Architecture

## Core Rule: Strict Service Segregation
Never mix frontend, backend, and deployment credentials.

### 1. Vercel Frontend (Public Browser Scope)
Only expose variables with `VITE_` prefix that are strictly necessary for client execution:
- `VITE_API_URL`: URL of the FastAPI backend.
- `VITE_SUPABASE_URL`: Public Supabase API URL.
- `VITE_SUPABASE_ANON_KEY`: Public anonymous Supabase key (protected by RLS).
- `VITE_LIVEKIT_URL`: WebRTC signaling gateway URL.

**PROHIBITED IN FRONTEND**:
- `DATABASE_URL`, `POSTGRES_PASSWORD`, `PRIVATE_KEY`, `ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Render Backend (Private Server Scope)
Private server-only credentials managed exclusively via Render Dashboard:
- `DATABASE_URL`: Connection string using `smartcare_backend` role.
- `PRIVATE_KEY` / `PUBLIC_KEY`: RS256 JWT keypair.
- `ENCRYPTION_KEY`: Server-side envelope encryption key for data-at-rest.
- `ALLOWED_ORIGINS`: Comma-separated CORS whitelist.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin-level Supabase operations.
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`: Video room credentials.

### 3. GitHub Actions CI/CD (Secret Scope)
Stored in GitHub Repository / Environment Secrets:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
