# SmartCare Security Model

## Core Principles
1. **Zero-Knowledge Encryption**: User master keys are generated and wrapped on the client side. Server stores only ciphertext.
2. **Least Privilege Runtime**:
   - The backend connects as `smartcare_backend`, a non-superuser role with `NOBYPASSRLS`.
   - Direct DDL permissions (`CREATE TABLE`, `DROP TABLE`) are revoked from the runtime backend.
   - Client roles `anon` and `authenticated` have zero table permissions; all traffic routes through FastAPI.
3. **Transaction-Scoped Identity (SET LOCAL)**:
   - FastAPI middleware validates RS256 JWT tokens.
   - Database sessions execute `SET LOCAL app.current_user_id = :uid` on every connection.
   - RLS policies resolve identity via `public.requesting_user_id()`.
   - Identity fails closed: if session binding fails, the transaction is rolled back immediately.
4. **Append-Only Immutable Auditing**:
   - Direct `UPDATE` and `DELETE` on `public.audit_logs` are intercepted and blocked by `trg_audit_logs_immutable`.
   - Inserts are routed strictly through trusted `SECURITY DEFINER` procedures:
     - `public.log_user_audit_event`: Binds actor strictly to session user.
     - `public.log_system_audit_event`: Dedicated for system/maintenance processes.
   - Audit logs are decoupled from user foreign keys to ensure audit trails survive account lifecycle events (HIPAA 45 CFR § 164.312(b)).

> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
