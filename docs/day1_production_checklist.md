**Day 1 Production Checklist**

- **Secrets & Keys**: Ensure `PRIVATE_KEY`, `PUBLIC_KEY`, and `ENCRYPTION_KEY` are stored in your secrets manager (not in repo). Confirm private key access is limited to CI/CD and the runtime orchestrator.
- **Database**: Run Alembic migrations: `alembic upgrade head`. Verify `vault_keys` and `mfa_recovery_codes` tables exist.
- **RLS**: If using Postgres RLS, implement per-connection session variable `app.current_user_id` setting. Example: Use `SET LOCAL app.current_user_id = '<user_id>'` inside request-scoped transactions, or configure a trusted function.
- **Docker & Runtime**: Build images with non-root user and verify filesystem permissions. Confirm ephemeral container user cannot access host secrets.
- **Nginx/Proxy**: Deploy reverse proxy with HSTS, CSP, X-Frame-Options, X-Content-Type-Options, and rate-limiting configured.
- **MFA Recovery**: When onboarding, generate and display recovery codes to the user; record their hashes server-side. Confirm a secure UI flow for one-time display and printing.
- **Logging & Monitoring**: Configure centralized logs (immutable) and audit streams. Ensure ENCRYPTION_KEY is rotated and rotations are auditable.
- **Security Testing**: Run automated SAST/DAST scanners, run penetration test checklist, and validate CI enforces required env variables.
- **Operational**: Configure backups for DB, rotate keys monthly/quarterly, lock down admin accounts with additional protections (IP allowlist, jump host), and verify incident response playbook is accessible.
