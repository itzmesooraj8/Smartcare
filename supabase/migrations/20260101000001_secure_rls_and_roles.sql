-- ==========================================================
-- SmartCare AI - Milestone 1: Database Security & RLS Isolation
-- Migration: 20260101000001_secure_rls_and_roles.sql
-- ==========================================================

-- 1. DEDICATED RUNTIME ROLE
-- The FastAPI runtime connects via smartcare_backend, which has NO BYPASSRLS.
-- postgres remains the administrative/migration owner.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartcare_backend') THEN
        CREATE ROLE smartcare_backend WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
    ELSE
        ALTER ROLE smartcare_backend WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
    END IF;
END $$;

-- 2. CONTEXT & IDENTITY HELPER FUNCTIONS
-- Extracts verified transaction-scoped user ID set by FastAPI (SET LOCAL app.current_user_id = :uid)
CREATE OR REPLACE FUNCTION public.requesting_user_id() 
RETURNS TEXT 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '');
$$;

-- Resolves requesting user's role from public.users using the verified identity
CREATE OR REPLACE FUNCTION public.current_app_user_role() 
RETURNS TEXT 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = public.requesting_user_id();
$$;

-- 3. REMOVE INSECURE LEGACY PUBLIC POLICIES
DROP POLICY IF EXISTS "Public access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public access for messages" ON public.messages;
DROP POLICY IF EXISTS "Public access for medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Public access for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public access for users" ON public.users;
DROP POLICY IF EXISTS "Public access for doctors" ON public.doctors;
DROP POLICY IF EXISTS "Public access for patients" ON public.patients;

DROP POLICY IF EXISTS "SmartCare demo appointments" ON public.appointments;
DROP POLICY IF EXISTS "SmartCare demo messages" ON public.messages;
DROP POLICY IF EXISTS "SmartCare demo medical records" ON public.medical_records;
DROP POLICY IF EXISTS "SmartCare demo audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "SmartCare demo users" ON public.users;
DROP POLICY IF EXISTS "SmartCare demo doctors" ON public.doctors;
DROP POLICY IF EXISTS "SmartCare demo patients" ON public.patients;

-- Also drop any prior policy names for idempotency
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "doctors_direct_select_policy" ON public.doctors;
DROP POLICY IF EXISTS "doctors_update_policy" ON public.doctors;
DROP POLICY IF EXISTS "patients_select_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_update_policy" ON public.patients;
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;
DROP POLICY IF EXISTS "medical_records_select_policy" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_insert_policy" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_update_policy" ON public.medical_records;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;

-- 4. ENABLE ROW LEVEL SECURITY
-- Standard RLS enabled. smartcare_backend is subject to RLS (NO BYPASSRLS).
-- postgres can bypass RLS for migrations/maintenance.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. USERS RLS POLICIES
-- SELECT: self, admin, or counterpart in active appointment
CREATE POLICY "users_select_policy" ON public.users FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE (a.patient_id = users.id AND a.doctor_id = public.requesting_user_id())
               OR (a.doctor_id = users.id AND a.patient_id = public.requesting_user_id())
        )
    )
);

-- INSERT: Admin or trusted backend connection during user registration
-- Note: direct PostgREST/client INSERT is blocked via REVOKE on table permissions.
-- Client cannot specify role='admin' (enforced by trigger).
CREATE POLICY "users_insert_policy" ON public.users FOR INSERT
WITH CHECK (
    public.current_app_user_role() = 'admin'
    OR (
        current_user IN ('smartcare_backend', 'postgres')
        AND (role IS NULL OR role IN ('patient', 'doctor'))
    )
);

-- UPDATE: Self update permitted profile info; Admin full update.
-- Role modification is blocked by trigger trg_prevent_role_change.
CREATE POLICY "users_update_policy" ON public.users FOR UPDATE
USING (
    public.requesting_user_id() IS NOT NULL AND (
        id = public.requesting_user_id() 
        OR public.current_app_user_role() = 'admin'
    )
);

-- 6. DOCTORS RLS & SAFE DOCTOR DIRECTORY VIEW
-- Base table: doctor reads/updates self; admin reads/updates
CREATE POLICY "doctors_direct_select_policy" ON public.doctors FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id() 
        OR public.current_app_user_role() = 'admin'
    )
);

CREATE POLICY "doctors_update_policy" ON public.doctors FOR UPDATE
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id() 
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    user_id = public.requesting_user_id() 
    OR public.current_app_user_role() = 'admin'
);

-- Safe Projection View: Explicitly excludes license_number
CREATE OR REPLACE VIEW public.doctor_directory AS
SELECT 
    d.id,
    d.user_id,
    u.full_name,
    d.specialization,
    d.bio,
    d.consultation_fee,
    d.availability
FROM public.doctors d
JOIN public.users u ON d.user_id = u.id
WHERE u.is_active = TRUE;

ALTER VIEW public.doctor_directory OWNER TO postgres;

-- 7. PATIENTS RLS POLICIES
-- Patient reads self; Admin reads; Treating doctor reads only with active appointment link
CREATE POLICY "patients_select_policy" ON public.patients FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
        OR (
            public.current_app_user_role() = 'doctor'
            AND EXISTS (
                SELECT 1 FROM public.appointments a
                WHERE a.patient_id = patients.user_id
                  AND a.doctor_id = public.requesting_user_id()
                  AND a.status IN ('booked', 'confirmed', 'completed', 'pending')
            )
        )
    )
);

CREATE POLICY "patients_update_policy" ON public.patients FOR UPDATE
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id() 
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    user_id = public.requesting_user_id() 
    OR public.current_app_user_role() = 'admin'
);

-- 8. APPOINTMENTS RLS POLICIES
CREATE POLICY "appointments_select_policy" ON public.appointments FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        patient_id = public.requesting_user_id()
        OR doctor_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
);

CREATE POLICY "appointments_insert_policy" ON public.appointments FOR INSERT
WITH CHECK (
    public.requesting_user_id() IS NOT NULL AND (
        (public.current_app_user_role() = 'patient' AND patient_id = public.requesting_user_id())
        OR (public.current_app_user_role() = 'doctor' AND doctor_id = public.requesting_user_id())
        OR public.current_app_user_role() = 'admin'
    )
);

CREATE POLICY "appointments_update_policy" ON public.appointments FOR UPDATE
USING (
    public.requesting_user_id() IS NOT NULL AND (
        patient_id = public.requesting_user_id()
        OR doctor_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
)
WITH CHECK (
    patient_id = public.requesting_user_id()
    OR doctor_id = public.requesting_user_id()
    OR public.current_app_user_role() = 'admin'
);

-- Restricted deletion: only admin or patient cancelling own unconfirmed booking
CREATE POLICY "appointments_delete_policy" ON public.appointments FOR DELETE
USING (
    public.requesting_user_id() IS NOT NULL AND (
        public.current_app_user_role() = 'admin'
        OR (
            patient_id = public.requesting_user_id()
            AND status IN ('booked', 'pending')
        )
    )
);

-- 9. MEDICAL RECORDS RLS POLICIES (ePHI Protection)
-- Patients: SELECT own records ONLY. ZERO write, update, or delete capability.
-- Doctors: SELECT, INSERT, UPDATE only with active authorized appointment relationship.
-- Admin: Denied direct ePHI browsing by default.
CREATE POLICY "medical_records_select_policy" ON public.medical_records FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR (
            public.current_app_user_role() = 'doctor'
            AND EXISTS (
                SELECT 1 FROM public.appointments a
                WHERE a.patient_id = medical_records.user_id
                  AND a.doctor_id = public.requesting_user_id()
                  AND a.status IN ('booked', 'confirmed', 'completed')
            )
        )
    )
);

CREATE POLICY "medical_records_insert_policy" ON public.medical_records FOR INSERT
WITH CHECK (
    public.requesting_user_id() IS NOT NULL
    AND public.current_app_user_role() = 'doctor'
    AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = medical_records.user_id
          AND a.doctor_id = public.requesting_user_id()
          AND a.status IN ('booked', 'confirmed', 'completed')
    )
);

CREATE POLICY "medical_records_update_policy" ON public.medical_records FOR UPDATE
USING (
    public.requesting_user_id() IS NOT NULL
    AND public.current_app_user_role() = 'doctor'
    AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = medical_records.user_id
          AND a.doctor_id = public.requesting_user_id()
          AND a.status IN ('booked', 'confirmed', 'completed')
    )
)
WITH CHECK (
    public.current_app_user_role() = 'doctor'
    AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = medical_records.user_id
          AND a.doctor_id = public.requesting_user_id()
          AND a.status IN ('booked', 'confirmed', 'completed')
    )
);

-- NO DELETE POLICY ON medical_records: records are permanent and retained for HIPAA compliance.

-- 10. MESSAGES RLS POLICIES (Chat Isolation)
CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        sender_id = public.requesting_user_id()
        OR receiver_id = public.requesting_user_id()
    )
);

CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT
WITH CHECK (
    public.requesting_user_id() IS NOT NULL
    AND sender_id = public.requesting_user_id()
);

CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE
USING (
    public.requesting_user_id() IS NOT NULL
    AND receiver_id = public.requesting_user_id()
)
WITH CHECK (
    receiver_id = public.requesting_user_id()
);

-- 11. AUDIT LOGS RLS POLICIES (Append-Only Immutable Audit Trail)
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs FOR SELECT
USING (
    public.requesting_user_id() IS NOT NULL AND (
        user_id = public.requesting_user_id()
        OR public.current_app_user_role() = 'admin'
    )
);

-- NO INSERT POLICY: Normal clients cannot directly insert audit logs.
-- NO UPDATE POLICY: Audit records cannot be modified.
-- NO DELETE POLICY: Audit records cannot be deleted.

-- 12. AUDIT IMMUTABILITY TRIGGER
CREATE OR REPLACE FUNCTION public.audit_logs_prevent_tamper() 
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.audit_logs_prevent_tamper();

-- 13. USER ROLE PROTECTION TRIGGERS
-- Prevents ordinary users from altering role or elevating to admin/doctor
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id TEXT;
    v_caller_role TEXT;
BEGIN
    IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
        RETURN NEW;
    END IF;

    v_caller_id := public.requesting_user_id();

    -- Allow migration/DBA operation if no session ID exists and connection is superuser/admin
    IF v_caller_id IS NULL THEN
        IF current_user IN ('postgres', 'supabase_admin') THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Role changes require administrative privileges';
        END IF;
    END IF;

    SELECT role INTO v_caller_role FROM public.users WHERE id = v_caller_id;
    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: only administrators can alter user roles';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.users;
CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- Prevents client-directed creation of admin users
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_admin_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id TEXT;
    v_caller_role TEXT;
BEGIN
    IF NEW.role <> 'admin' THEN
        RETURN NEW;
    END IF;

    v_caller_id := public.requesting_user_id();

    IF v_caller_id IS NULL THEN
        IF current_user IN ('postgres', 'supabase_admin') THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Direct creation of admin accounts is prohibited';
        END IF;
    END IF;

    SELECT role INTO v_caller_role FROM public.users WHERE id = v_caller_id;
    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: only existing administrators can provision admin accounts';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_insert ON public.users;
CREATE TRIGGER trg_prevent_admin_insert
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unauthorized_admin_insert();

-- 14. BIFURCATED AUDIT LOGGING FUNCTIONS
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.log_user_audit_event(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.log_system_audit_event(TEXT, TEXT, TEXT, TEXT);

-- A. User-context Audit: Actor is strictly locked to requesting_user_id()
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
        uuid_generate_v4()::TEXT,
        v_actor_id,
        p_target_id,
        p_action,
        p_resource_type,
        p_ip_address,
        NOW()
    );
END;
$$;

-- B. System Audit: Actor is strictly hardcoded to 'system'
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
        uuid_generate_v4()::TEXT,
        'system',
        p_target_id,
        p_action,
        p_resource_type,
        p_ip_address,
        NOW()
    );
END;
$$;

-- Audit execution permissions: strictly restricted to backend and admin
REVOKE ALL ON FUNCTION public.log_user_audit_event FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_system_audit_event FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_audit_event TO smartcare_backend, postgres;
GRANT EXECUTE ON FUNCTION public.log_system_audit_event TO smartcare_backend, postgres;

-- 15. TABLE & VIEW PRIVILEGES (Defense in Depth)
-- Revoke all table, view, sequence, and routine privileges from client-facing roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Grant least-privilege permissions to smartcare_backend
GRANT SELECT, INSERT, UPDATE ON public.users TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE ON public.doctors TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE ON public.patients TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE ON public.medical_records TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE ON public.messages TO smartcare_backend;
GRANT SELECT ON public.audit_logs TO smartcare_backend;
GRANT SELECT ON public.doctor_directory TO smartcare_backend;

-- Secondary vault & MFA tables
GRANT SELECT, INSERT, UPDATE ON public.vault_keys TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE ON public.mfa_recovery_codes TO smartcare_backend;
GRANT SELECT, INSERT, UPDATE ON public.recovery_seeds TO smartcare_backend;

-- Grant sequence privileges strictly on SERIAL tables (doctors and patients)
GRANT USAGE, SELECT ON SEQUENCE public.doctors_id_seq TO smartcare_backend;
GRANT USAGE, SELECT ON SEQUENCE public.patients_id_seq TO smartcare_backend;

-- 16. SUPABASE REALTIME & REPLICA IDENTITY HARDENING
-- Remove audit_logs from realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs;
    END IF;
END $$;

-- Reset REPLICA IDENTITY from FULL to DEFAULT for sensitive tables
ALTER TABLE public.medical_records REPLICA IDENTITY DEFAULT;
ALTER TABLE public.audit_logs REPLICA IDENTITY DEFAULT;
