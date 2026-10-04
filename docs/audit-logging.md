# SmartCare Audit Logging Architecture

## Legal & Compliance Framework
In healthcare platforms handling Protected Health Information (PHI), access logging must comply with:
- **HIPAA Security Rule (45 CFR § 164.312(b))**: Audit controls recording and examining system activity.
- **GDPR Article 30**: Records of processing activities.

## Architectural Model (B2 Decoupled Append-Only Ledger)
```
Application / Client
       ↓ (FastAPI)
Bifurcated Procedure Call
 ├── User Activity: log_user_audit_event() -> Actor = requesting_user_id()
 └── System Task:   log_system_audit_event() -> Actor = 'system'
       ↓
SECURITY DEFINER (search_path = public, pg_temp)
       ↓
INSERT INTO public.audit_logs
       ↓
Trigger Protection: trg_audit_logs_immutable (BLOCKED: UPDATE, DELETE)
```

## Security Invariants
1. **Decoupled Identity**: `audit_logs.user_id` does not maintain a cascading foreign key to `users(id)`. If a user account is deleted, their historical audit trail remains intact and immutable.
2. **Actor Immutability**: Callers cannot supply or forge the actor ID. `log_user_audit_event` extracts the actor strictly from `public.requesting_user_id()`.
3. **Hardened Search Path**: Both functions execute with `SET search_path = public, pg_temp` to prevent search_path hijack vulnerabilities.
4. **UUID Generation**: Uses built-in `gen_random_uuid()` to prevent external extension dependencies.

> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
