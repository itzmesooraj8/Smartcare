# SmartCare Database Management & Migration Protocol

## Database Engine
- **Engine**: PostgreSQL 17 (Supabase Managed)
- **Runtime Role**: `smartcare_backend` (NOBYPASSRLS)
- **Migration Role**: `postgres` (Admin / CI deployment only)

## Table Security Matrix
All public domain and auxiliary tables have Row Level Security (RLS) enabled:
- `users`: User-isolation policy (`id = requesting_user_id()`)
- `doctors`: Doctor profile directory and record isolation
- `patients`: Patient medical directory isolation
- `appointments`: Patient and attending doctor access
- `medical_records`: End-to-end encrypted medical record isolation
- `messages`: Chat message sender/receiver isolation
- `audit_logs`: Append-only compliance ledger; SELECT restricted to self or admin
- `vault_keys`: User-isolation policy
- `mfa_recovery_codes`: User-isolation policy
- `recovery_seeds`: User-isolation policy
- `vault_entries`: User-isolation policy; granted to `smartcare_backend`
- `alembic_version`: RLS enabled; client access revoked

## Migration Sequence & Chain of Custody
Migrations live in `supabase/migrations/` and must maintain exact chronological naming:
- `20260101000000_init_smartcare_realtime.sql`: Base tables and realtime setup
- `20260101000001_secure_rls_and_roles.sql`: RLS policies, role creation, immutable audit triggers
- `20260101000002_fix_audit_functions_uuid.sql`: Replacement of uuid_generate_v4() with gen_random_uuid()
- `20260101000003_decouple_audit_logs_fk.sql`: Removal of audit_logs foreign key for decoupled ledger (B2)
- `20260101000004_secure_vault_and_auxiliary_tables.sql`: RLS enablement on auxiliary tables and registry sync

## Migration Rule
> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
> All schema modifications must occur via explicit migration files submitted through GitHub PR and applied via Supabase CLI.
