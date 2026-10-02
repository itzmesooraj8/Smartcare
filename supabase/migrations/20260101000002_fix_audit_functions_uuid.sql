-- Follow-up migration: Replace uuid_generate_v4() with gen_random_uuid() in audit functions
-- Resolves uuid-ossp extension dependency while preserving hardened search_path

CREATE OR REPLACE FUNCTION public.log_user_audit_event(
    p_action TEXT,
    p_resource_type TEXT,
    p_target_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id TEXT;
BEGIN
    v_actor_id := public.requesting_user_id();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'User audit event requires an active authenticated user context';
    END IF;

    INSERT INTO public.audit_logs (id, user_id, target_id, action, resource_type, ip_address, timestamp)
    VALUES (
        gen_random_uuid()::TEXT,
        v_actor_id,
        p_target_id,
        p_action,
        p_resource_type,
        p_ip_address,
        NOW()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_system_audit_event(
    p_action TEXT,
    p_resource_type TEXT,
    p_target_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.audit_logs (id, user_id, target_id, action, resource_type, ip_address, timestamp)
    VALUES (
        gen_random_uuid()::TEXT,
        'system',
        p_target_id,
        p_action,
        p_resource_type,
        p_ip_address,
        NOW()
    );
END;
$$;
