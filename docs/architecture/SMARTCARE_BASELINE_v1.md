# SmartCare Platform — Architectural Baseline v1.0

## Baseline Metadata
- **Status**: FROZEN / VERIFIED
- **Git Commit SHA**: `b12f1b8`
- **Branch**: `main`
- **Remote**: `https://github.com/itzmesooraj8/Smartcare.git`
- **Database Engine**: PostgreSQL 17 (Supabase Managed, AWS ap-southeast-1)
- **Application Frameworks**: React 18 (Vite, TS) / FastAPI (Python 3.11, SQLAlchemy 2.0)

---

## 1. Authoritative Migration Ledger & Cryptographic Hashes

All database schema definition is strictly migration-controlled. Startup DDL (`create_all()`) and runtime seeding are disabled in production.

| Version | Migration Name | SHA-256 Hash | Status |
| :--- | :--- | :--- | :--- |
| `20260101000000` | `init_smartcare_realtime.sql` | `FB86BBDFFF987530DFBE913B5A876DB6EBAE72213ED075CC37410210317745D3` | Frozen |
| `20260101000001` | `secure_rls_and_roles.sql` | `94B346A6988DB4375984FC35F26B2F546D40BC8BDAF19272DB9C908D4BFDC779` | Frozen |
| `20260101000002` | `fix_audit_functions_uuid.sql` | `49DF7E9E476B44EAF3459F6AFE252A6317B66003D459B101124DBDDFE16F8C50` | Frozen |
| `20260101000003` | `decouple_audit_logs_fk.sql` | `108B7F553DF43315D1B438BB6B48AC9FB5B75C586ECDAD9F3A2C1243F41E0B00` | Frozen |
| `20260101000004` | `secure_vault_and_auxiliary_tables.sql` | `D888A118C86A8D21E47DB315B8C1CE4D8A236AC3DC69705C85BDFE5091252762` | Frozen |
| `20260101000005` | `retire_alembic_and_harden_security.sql` | `0514F971AAA25EAB60EB8F110B8AF960ABD7086F2D57649DE0984D2870C72247` | Frozen |

---

## 2. Live Database State & RLS Verification

The production database contains exactly 11 public tables. 100% of tables have Row-Level Security actively enforced:

```
public.appointments         | RLS: ENABLED
public.audit_logs           | RLS: ENABLED (Immutable append-only trigger)
public.doctors              | RLS: ENABLED
public.medical_records      | RLS: ENABLED
public.messages             | RLS: ENABLED
public.mfa_recovery_codes   | RLS: ENABLED
public.patients             | RLS: ENABLED
public.recovery_seeds       | RLS: ENABLED
public.users                | RLS: ENABLED
public.vault_entries        | RLS: ENABLED (CRUD granted to smartcare_backend)
public.vault_keys           | RLS: ENABLED
```

- **Legacy Table Status**: `public.alembic_version` has been permanently dropped (`retire_alembic_and_harden_security`).
- **Security Definer Privileges**: Function execution on all internal security procedures (`log_user_audit_event`, `log_system_audit_event`, `current_app_user_role`, `requesting_user_id`, `prevent_unauthorized_admin_insert`, `prevent_unauthorized_role_change`, `audit_logs_prevent_tamper`) is revoked from `PUBLIC`, `anon`, and `authenticated`, restricted strictly to `smartcare_backend`, `postgres`, and `service_role`.
- **Search Path Isolation**: All security definer functions enforce `SET search_path = public, pg_temp;`.

---

## 3. Infrastructure Deployment Baseline & Drift Matrix

| Target Component | Desired Production State | Live Infrastructure State | Parity Status | Required Action |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase PostgreSQL** | Migrations 000000–000005 applied, 11 RLS tables, hardened functions | Identical | **VERIFIED PARITY** | None. Maintain migration lock. |
| **GitHub Repository** | Branch `main` at `b12f1b8`, clean tree, CI workflows active | Identical | **VERIFIED PARITY** | None. Quality gates enforced. |
| **Render Web Service** (`srv-d4hds9f5r7bs73bpqoag`) | Build: `pip install -r requirements.txt`<br>Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`<br>Role: `smartcare_backend` | Build: `pip install -r requirements.txt && alembic upgrade head` | **DRIFT IDENTIFIED** | Update Render service build command in Dashboard to remove Alembic. |
| **Vercel Frontend** (`smartcare-six.vercel.app`) | Build: `npm run build`, Output: `dist`, proxy to FastAPI | Active deployment | **VERIFICATION GATED** | Validate environment variables & project link. |

---

## 4. Key Architectural Invariants

1. **No Direct Browser Database Mutations**: Frontend clients must not directly mutate database tables via Supabase Data APIs. All clinical operations, appointment bookings, and message persistence route through the authenticated FastAPI application layer.
2. **Migration Authority**: Production database schema changes must only be deployed via sequential SQL files under `supabase/migrations/` validated through CI/CD.
3. **Audit Ledger Independence**: Audit logs are completely decoupled from user lifecycle operations (no cascading foreign keys). Events are recorded via `SECURITY DEFINER` procedures with immutability triggers preventing updates or deletions.
4. **Least-Privilege Database Role**: Production application connects via `smartcare_backend` with `NOBYPASSRLS`. High-privilege administrative credentials (`postgres`) are reserved strictly for migration execution.
