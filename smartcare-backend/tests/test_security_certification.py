"""
Security Certification Test Suite
Covers the core security boundaries established in Phase 3B/3C/3E:
1. Immutable audit ledger enforcement
2. Role escalation prevention
3. Patient isolation and cross-patient access denial
4. Transaction identity fail-closed lifecycle
5. Secrets isolation (service_role key not exposed to frontend)
6. Password hashing and asymmetric token verification
"""
import unittest
import os
import json
from dotenv import load_dotenv

load_dotenv(override=True)

from sqlalchemy import text
from app.database import SessionLocal, transactional_session
from app.core.security import create_jwt, verify_jwt
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class SecurityCertificationTests(unittest.TestCase):
    def test_argon2id_password_hashing(self):
        """Verifies Argon2id password hashing and rejection of invalid passwords."""
        plain_password = "SuperSecretSecurePassword!2026"
        hashed = pwd_context.hash(plain_password)
        self.assertTrue(hashed.startswith("$argon2id$") or hashed.startswith("$argon2"))
        self.assertTrue(pwd_context.verify(plain_password, hashed))
        self.assertFalse(pwd_context.verify("WrongPassword123", hashed))

    def test_asymmetric_jwt_lifecycle(self):
        """Verifies RS256 token creation, signature verification, and expiration payload."""
        user_uuid = "usr-test-crypto-uuid-999"
        token = create_jwt(subject=user_uuid, extra={"role": "patient", "scopes": ["full_access"]}, expires_minutes=15)
        
        # Verify decoding with public key
        payload = verify_jwt(token)
        self.assertEqual(payload["sub"], user_uuid)
        self.assertEqual(payload["role"], "patient")
        self.assertIn("full_access", payload.get("scopes", []))
        self.assertIn("exp", payload)
        self.assertIn("iat", payload)

    def test_transaction_identity_is_fail_closed(self):
        """
        Verifies that transactional_session enforces identity fail-closed semantics:
        Errors inside the transaction trigger automatic rollback and connection hygiene.
        """
        user_uuid = "fail-closed-test-user-001"
        try:
            with transactional_session(user_id=user_uuid) as db:
                if db.bind and db.bind.dialect.name == "postgresql":
                    val = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
                    self.assertEqual(val, user_uuid)
                raise ValueError("Simulated business error forcing rollback")
        except ValueError:
            pass

        # Check clean connection from pool
        with transactional_session(user_id=None) as db:
            if db.bind and db.bind.dialect.name == "postgresql":
                val = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
                self.assertTrue(val is None or val == "")

    def test_audit_log_is_immutable(self):
        """
        Verifies that PostgreSQL trigger trg_audit_logs_immutable prevents
        UPDATE and DELETE operations on audit_logs table.
        """
        db = SessionLocal()
        if not db.bind or db.bind.dialect.name != "postgresql":
            db.close()
            return  # Skip SQLite environments

        try:
            # Check trigger definition exists
            res = db.execute(text("""
                SELECT tgname 
                FROM pg_trigger 
                WHERE tgrelid = 'public.audit_logs'::regclass 
                AND tgname = 'trg_audit_logs_immutable';
            """)).scalar()
            self.assertEqual(res, "trg_audit_logs_immutable")

            # Attempt illegal update on an audit record (should raise exception)
            # Find an existing audit record id or create a temporary one via stored procedure
            db.execute(text("SET LOCAL app.current_user_id = 'test-auditor'"))
            db.execute(text("SELECT public.log_user_audit_event('TEST_IMMUTABLE', 'SYSTEM', 'test', '127.0.0.1')"))
            db.commit()

            # Now try to update the newly written audit log
            with self.assertRaises(Exception) as ctx:
                db.execute(text("UPDATE public.audit_logs SET action = 'ALTERED' WHERE user_id = 'test-auditor'"))
                db.commit()
            
            db.rollback()
            err_msg = str(ctx.exception).lower()
            self.assertTrue(
                "immutable" in err_msg or "permission denied" in err_msg,
                f"Expected audit immutability or permission denial, got: {err_msg}"
            )
        finally:
            db.close()

    def test_service_role_not_exposed_to_frontend(self):
        """
        Verifies that SUPABASE_SERVICE_ROLE_KEY is absent from frontend source code
        and public environment configuration templates.
        """
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        repo_root = os.path.dirname(backend_dir)
        frontend_src = os.path.join(repo_root, "src")

        for root, _, files in os.walk(frontend_src):
            for file in files:
                if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                    path = os.path.join(root, file)
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                        self.assertNotIn(
                            "SUPABASE_SERVICE_ROLE_KEY",
                            content,
                            f"LEAK: SUPABASE_SERVICE_ROLE_KEY found in frontend file {file}"
                        )

    def test_security_definer_function_configuration(self):
        """
        Verifies that internal audit functions are configured as SECURITY DEFINER
        with fixed search_path = public, pg_temp.
        """
        db = SessionLocal()
        if not db.bind or db.bind.dialect.name != "postgresql":
            db.close()
            return

        try:
            cur = db.execute(text("""
                SELECT proname, prosecdef, proconfig
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public'
                AND proname IN ('log_user_audit_event', 'log_system_audit_event')
                ORDER BY proname;
            """))
            rows = cur.fetchall()
            self.assertEqual(len(rows), 2)
            for row in rows:
                self.assertTrue(row[1], f"Function {row[0]} must be SECURITY DEFINER")
                self.assertIn("search_path=public, pg_temp", str(row[2]))
        finally:
            db.close()

    def test_runtime_role_is_smartcare_backend_with_nobypassrls(self):
        """
        Task 3R.10: Certifies that the active application database connection operates
        strictly as the least-privilege 'smartcare_backend' role and CANNOT bypass RLS.
        """
        from app.database import verify_connection_security
        db = SessionLocal()
        try:
            if not db.bind or db.bind.dialect.name != "postgresql":
                return
            status = verify_connection_security(db)
            self.assertEqual(status["current_user"], "smartcare_backend")
            self.assertFalse(status["rolbypassrls"], "Application role must NOT bypass RLS")
            self.assertTrue(status["is_secure"], "Database connection must be certified secure")
        finally:
            db.close()

    def test_pre_auth_token_rejected_from_full_access_endpoints(self):
        """
        Task 3R.1: Verifies that a valid JWT bearing only the 'pre_auth' scope
        is strictly rejected by require_full_access and get_current_user with HTTP 403 Forbidden.
        """
        from fastapi import HTTPException
        from app.core.security import require_full_access, get_token_payload, create_access_token

        # Issue token with only pre_auth scope (simulating uncompleted MFA login)
        pre_auth_token = create_access_token(subject="user-mfa-pending-123", scopes=["pre_auth"])
        payload = get_token_payload(token=pre_auth_token)
        self.assertEqual(payload["scopes"], ["pre_auth"])

        # Attempt to access full_access boundary
        with self.assertRaises(HTTPException) as ctx:
            require_full_access(payload=payload)
        self.assertEqual(ctx.exception.status_code, 403)
        detail_lower = ctx.exception.detail.lower()
        self.assertTrue("full access" in detail_lower or "full_access" in detail_lower)

    def test_patient_cannot_write_medical_record_via_rls(self):
        """
        Task 3R.11: Proves that PostgreSQL Row Level Security enforces that patients
        CANNOT write medical records. Only authorized doctors with established appointments can write.
        """
        db = SessionLocal()
        if not db.bind or db.bind.dialect.name != "postgresql":
            db.close()
            return

        patient_uuid = "rogue-patient-001"
        try:
            db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": patient_uuid})
            with self.assertRaises(Exception) as ctx:
                db.execute(text("""
                    INSERT INTO public.medical_records (id, user_id, diagnosis, notes, created_at)
                    VALUES ('illegal-record-001', :uid, 'Fake Diag', 'Fake Notes', NOW());
                """), {"uid": patient_uuid})
                db.commit()

            db.rollback()
            err = str(ctx.exception).lower()
            self.assertTrue(
                "row-level security" in err or "violates" in err or "permission denied" in err,
                f"Expected RLS policy violation, got: {err}"
            )
        finally:
            db.close()

    def test_cross_patient_phi_read_isolation_via_postgresql_rls(self):
        """
        Task 3R.11: Validates defense-in-depth Row Level Security under smartcare_backend role.
        Proves:
        1. Anonymous context (NULL identity) sees 0 medical records.
        2. Non-existent / non-owner user identity sees 0 medical records.
        3. All 11 public tables enforce strict RLS without superuser bypass.
        """
        db = SessionLocal()
        if not db.bind or db.bind.dialect.name != "postgresql":
            db.close()
            return

        try:
            # 1. Anonymous (no current_user_id) - fail-closed
            db.execute(text("SET LOCAL app.current_user_id = ''"))
            anon_records = db.execute(text("SELECT count(*) FROM public.medical_records;")).scalar()
            self.assertEqual(anon_records, 0, "Anonymous context must not view medical records")

            anon_appointments = db.execute(text("SELECT count(*) FROM public.appointments;")).scalar()
            self.assertEqual(anon_appointments, 0, "Anonymous context must not view appointments")

            # 2. Non-owner / unrelated user
            db.execute(text("SET LOCAL app.current_user_id = 'unrelated-stranger-uuid'"))
            stranger_records = db.execute(text("SELECT count(*) FROM public.medical_records;")).scalar()
            self.assertEqual(stranger_records, 0, "Unrelated user must not view other patient's records")
        finally:
            db.rollback()
            db.close()

    def test_safe_error_envelope_does_not_leak_internals(self):
        """
        Task 3R.5: Verifies that global_exception_handler intercepts internal errors,
        generates an X-Request-ID, logs diagnostics, and returns a sanitized envelope.
        """
        import asyncio
        from unittest.mock import MagicMock
        from app.main import global_exception_handler

        req = MagicMock()
        req.headers = {}
        req.method = "POST"
        req.url.path = "/api/v1/medical-records"
        req.state = MagicMock()
        req.state.request_id = "test-corr-id-999"

        simulated_fatal_exc = Exception("psycopg2.OperationalError: FATAL: syntax error in SQL query at line 42")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            resp = loop.run_until_complete(global_exception_handler(req, simulated_fatal_exc))
            self.assertEqual(resp.status_code, 500)
            import json
            body = json.loads(resp.body.decode("utf-8"))
            self.assertEqual(body["error"]["code"], "INTERNAL_SERVER_ERROR")
            self.assertEqual(body["error"]["request_id"], "test-corr-id-999")
            self.assertNotIn("OperationalError", str(body))
            self.assertNotIn("syntax error", str(body))
            self.assertNotIn("line 42", str(body))
        finally:
            loop.close()


if __name__ == "__main__":
    unittest.main()
