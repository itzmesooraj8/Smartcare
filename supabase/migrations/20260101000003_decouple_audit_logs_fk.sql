-- Migration: Decouple audit_logs foreign key constraint to create an append-only audit ledger
-- Reason: Resolves Gate 7 schema conflict (enabling 'system' and service actors) and prevents
-- cascade deletion or deadlock with immutable audit log triggers (HIPAA 45 CFR § 164.312(b)).

-- 1. Drop the cascading foreign key constraint from audit_logs to users
ALTER TABLE public.audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Note:
-- - The column 'user_id' remains VARCHAR NOT NULL (every audit record must have an identified actor).
-- - The index 'idx_audit_logs_user' is preserved for fast lookups and RLS policy evaluation.
-- - The immutability trigger 'trg_audit_logs_immutable' remains active.
-- - Stored procedures 'log_user_audit_event' and 'log_system_audit_event' can now record actors
--   without violating foreign key constraints or risking audit history loss upon user account deletion.
