-- Migration: Secure auxiliary and vault tables with Row Level Security, grant vault_entries privileges to smartcare_backend, and synchronize migration registry

-- 1. Enable RLS on auxiliary tables
ALTER TABLE public.vault_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;

-- 2. User-isolation RLS policies
DROP POLICY IF EXISTS "vault_keys_user_isolation" ON public.vault_keys;
CREATE POLICY "vault_keys_user_isolation" ON public.vault_keys
FOR ALL
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
);

DROP POLICY IF EXISTS "mfa_recovery_codes_user_isolation" ON public.mfa_recovery_codes;
CREATE POLICY "mfa_recovery_codes_user_isolation" ON public.mfa_recovery_codes
FOR ALL
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
);

DROP POLICY IF EXISTS "recovery_seeds_user_isolation" ON public.recovery_seeds;
CREATE POLICY "recovery_seeds_user_isolation" ON public.recovery_seeds
FOR ALL
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
);

DROP POLICY IF EXISTS "vault_entries_user_isolation" ON public.vault_entries;
CREATE POLICY "vault_entries_user_isolation" ON public.vault_entries
FOR ALL
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
);

-- 3. Grants for smartcare_backend
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_entries TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_keys TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mfa_recovery_codes TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recovery_seeds TO smartcare_backend;

-- 4. Revoke access from client roles
REVOKE ALL ON public.vault_entries, public.vault_keys, public.mfa_recovery_codes, public.recovery_seeds, public.alembic_version FROM anon, authenticated;

-- 5. Reconcile Supabase migration registry
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES 
    ('20260101000001', 'secure_rls_and_roles'),
    ('20260101000002', 'fix_audit_functions_uuid'),
    ('20260101000003', 'decouple_audit_logs_fk'),
    ('20260101000004', 'secure_vault_and_auxiliary_tables')
ON CONFLICT (version) DO NOTHING;
