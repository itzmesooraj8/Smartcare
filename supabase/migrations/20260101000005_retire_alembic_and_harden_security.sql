-- Migration: 20260101000005_retire_alembic_and_harden_security.sql
-- Description: Retire legacy alembic_version table and harden function search paths and execution privileges per Supabase Security Advisor.

BEGIN;

-- 1. RETIRE LEGACY ALEMBIC ARTIFACT
-- Migrations are strictly governed by Supabase. Drop legacy alembic_version table.
DROP TABLE IF EXISTS public.alembic_version CASCADE;

-- 2. HARDEN AUDIT IMMUTABILITY TRIGGER FUNCTION SEARCH_PATH
-- Fixes Supabase Security Advisor warning: "audit_logs_prevent_tamper has a mutable search_path"
CREATE OR REPLACE FUNCTION public.audit_logs_prevent_tamper() 
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are prohibited.';
END;
$$;

-- 3. RESTRICT EXECUTION OF SECURITY DEFINER & INTERNAL HELPER FUNCTIONS
-- Fixes Supabase Security Advisor warnings: functions executable by anon / authenticated.
-- Internal security and audit functions must only be executable by backend and administrative roles.

REVOKE EXECUTE ON FUNCTION public.current_app_user_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_role() TO smartcare_backend, postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.requesting_user_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requesting_user_id() TO smartcare_backend, postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.prevent_unauthorized_admin_insert() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_unauthorized_admin_insert() TO smartcare_backend, postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.prevent_unauthorized_role_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_unauthorized_role_change() TO smartcare_backend, postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.audit_logs_prevent_tamper() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_logs_prevent_tamper() TO smartcare_backend, postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.log_user_audit_event(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_audit_event(text, text, text, text) TO smartcare_backend, postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.log_system_audit_event(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_system_audit_event(text, text, text, text) TO smartcare_backend, postgres, service_role;

COMMIT;
