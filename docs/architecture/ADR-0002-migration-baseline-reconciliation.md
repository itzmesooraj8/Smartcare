# ADR-0002: Reconciliation of Supabase Production Migration Baseline

## Status
Accepted and Synchronized

## Context
During the Phase 3 enterprise security and architectural audit, inspection of the live production database (`aws-0-ap-southeast-1.pooler.supabase.com`) revealed that the migration history table `supabase_migrations.schema_migrations` contains the baseline entry:
- **Version**: `20260927125836`
- **Name**: `smartcare_realtime_baseline_20260927`
- **Statements SHA-256**: `1880115a7724ae810a0c58a91c0e932574202d004d35052e431cfbfdf59a3bc7`

The Git repository previously tracked a file named `supabase/migrations/20260101000000_init_smartcare_realtime.sql` with identical semantic DDL but a differing synthetic timestamp prefix (`20260101000000`). This created a discrepancy where the Supabase CLI would view `20260927125836` as an untracked production migration.

## Decision
1. In strict adherence to migration immutability ("never rewrite or edit existing migrations"), the existing `20260101000000_init_smartcare_realtime.sql` migration remains frozen and unchanged.
2. The exact SQL statements recorded under `20260927125836` in production Supabase have been exported and committed to Git at:
   `supabase/migrations/20260927125836_smartcare_realtime_baseline_20260927.sql`
3. This achieves 100% parity between Git and the live production `schema_migrations` table without destructive rollback or historical mutation.

## Verification
- Both files exist in `supabase/migrations/`.
- The live Supabase PostgreSQL database records:
  - `20260101000001_secure_rls_and_roles`
  - `20260101000002_fix_audit_functions_uuid`
  - `20260101000003_decouple_audit_logs_fk`
  - `20260101000004_secure_vault_and_auxiliary_tables`
  - `20260101000005_retire_alembic_and_harden_security`
  - `20260927125836_smartcare_realtime_baseline_20260927`
- Zero unapplied, pending, or drifting migrations exist.
