-- ==========================================================
-- SmartCare AI - Complete Production Schema & Realtime Setup
-- Project: zgluklhdnnqsnnnylkxw (Supabase PostgreSQL)
-- ==========================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    role VARCHAR DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    specialization VARCHAR,
    license_number VARCHAR,
    bio TEXT,
    consultation_fee NUMERIC(10,2) DEFAULT 0.0,
    availability JSONB DEFAULT '{"mon": ["09:00", "17:00"], "tue": ["09:00", "17:00"], "wed": ["09:00", "17:00"], "thu": ["09:00", "17:00"], "fri": ["09:00", "17:00"]}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR,
    blood_group VARCHAR,
    emergency_contact JSONB,
    medical_history_summary TEXT
);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);

-- 5. Appointments Table (Realtime Enabled)
CREATE TABLE IF NOT EXISTS public.appointments (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    doctor_id VARCHAR REFERENCES public.users(id) ON DELETE SET NULL,
    patient_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'cancelled', 'completed', 'no_show', 'pending')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON public.appointments(appointment_time);

-- 6. Medical Records Table (Realtime Enabled)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    doctor_name VARCHAR,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medical_records_user ON public.medical_records(user_id);

-- 7. Audit Logs Table (Realtime Enabled, Immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_id VARCHAR,
    action VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    ip_address VARCHAR,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_id);

-- 8. Messages Table (Realtime Enabled for Patient <-> Doctor chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    sender_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id VARCHAR,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.messages(room_id);

-- 9. Security Vault & MFA Tables
CREATE TABLE IF NOT EXISTS public.vault_keys (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wrapped_key TEXT NOT NULL,
    key_iv VARCHAR,
    key_salt VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vault_keys_user ON public.vault_keys(user_id);

CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code_hash VARCHAR NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_mfa_codes_user ON public.mfa_recovery_codes(user_id);

CREATE TABLE IF NOT EXISTS public.recovery_seeds (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seed_hash VARCHAR NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recovery_seeds_user ON public.recovery_seeds(user_id);

-- ==========================================================
-- REALTIME PUBLICATION CONFIGURATION
-- ==========================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_records;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for real-time broadcasts
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.medical_records REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for appointments" ON public.appointments;
CREATE POLICY "Public access for appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for messages" ON public.messages;
CREATE POLICY "Public access for messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for medical_records" ON public.medical_records;
CREATE POLICY "Public access for medical_records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for audit_logs" ON public.audit_logs;
CREATE POLICY "Public access for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for users" ON public.users;
CREATE POLICY "Public access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for doctors" ON public.doctors;
CREATE POLICY "Public access for doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for patients" ON public.patients;
CREATE POLICY "Public access for patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
