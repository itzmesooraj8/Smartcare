# Security Policy

## Reporting a Vulnerability
SmartCare treats security with the highest clinical and compliance standards. If you discover a vulnerability or potential security flaw, please report it immediately:
- **Email**: security@smartcare.app
- Please include reproduction steps, environment details, and proof of concept.
- Do not disclose vulnerabilities publicly until patched.

## Architectural Security Invariants
1. **Least Privilege Database Access**: The backend executes with `smartcare_backend` (`NOBYPASSRLS`).
2. **Transaction-Scoped User Identity**: Database transactions bind user identity via `SET LOCAL app.current_user_id` and fail closed.
3. **Decoupled Append-Only Audit Trail**: Audit records are immutable (`trg_audit_logs_immutable`) and survive account lifecycle events.
4. **Authoritative Schema Control**:
   > **CRITICAL RULE**:
   > Production database schema is migration-controlled. Never modify production schema manually.
