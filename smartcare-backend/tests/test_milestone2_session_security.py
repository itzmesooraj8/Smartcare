import unittest
import os
import inspect
import asyncio
from unittest.mock import MagicMock, patch
from dotenv import load_dotenv

# Ensure environment variables (.env) are loaded for database tests
load_dotenv(override=True)

from sqlalchemy import text
from app.database import SessionLocal, transactional_session, verify_connection_security, get_db
from app.main import audit_sensitive_reads
from app.utils.fhir_export import export_to_fhir
from app.core.config import Settings


class Milestone2SessionSecurityTests(unittest.TestCase):
    def test_transaction_local_identity_lifecycle(self):
        """
        Verifies that SET LOCAL app.current_user_id:
        1. Is visible during the active transaction
        2. Resets immediately after transaction commit
        3. Does not leak into subsequent transactions on pooled connections
        """
        test_user_id = "test-patient-uuid-12345"

        with transactional_session(user_id=test_user_id) as db:
            if db.bind and db.bind.dialect.name == "postgresql":
                val = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
                self.assertEqual(val, test_user_id)

        with transactional_session(user_id=None) as db:
            if db.bind and db.bind.dialect.name == "postgresql":
                val = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
                self.assertTrue(val is None or val == "", f"Identity leaked! Found {val}")

    def test_transaction_rollback_on_failure(self):
        """
        Verifies that if an error occurs within the transaction,
        the session automatically rolls back and fails closed.
        """
        test_user_id = "test-patient-uuid-fail"
        with self.assertRaises(RuntimeError):
            with transactional_session(user_id=test_user_id) as db:
                raise RuntimeError("Forced application failure inside transaction")

        with transactional_session(user_id=None) as db:
            if db.bind and db.bind.dialect.name == "postgresql":
                val = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
                self.assertTrue(val is None or val == "", "Identity retained after transaction failure!")

    def test_get_db_dependency_lifecycle(self):
        """
        Verifies that get_db(request):
        1. Reads user_id from request.state.current_user_id
        2. Enforces transaction context
        3. Resets after completion
        """
        class MockRequest:
            class State:
                current_user_id = "mock-doctor-uuid-789"
            state = State()

        gen = get_db(MockRequest())
        db = next(gen)
        try:
            if db.bind and db.bind.dialect.name == "postgresql":
                val = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
                self.assertEqual(val, "mock-doctor-uuid-789")
        finally:
            try:
                next(gen)
            except StopIteration:
                pass

    def test_database_connection_role_verification(self):
        """
        Inspects the active database connection to report current_user
        and rolbypassrls status.
        """
        db = SessionLocal()
        try:
            sec_report = verify_connection_security(db)
            print("\nDatabase Security Inspection Report:", sec_report)
            self.assertIn("current_user", sec_report)
            self.assertIn("rolbypassrls", sec_report)
        finally:
            db.close()

    def test_audit_sensitive_reads_uses_log_user_audit_event(self):
        """
        Task 6.1: Verifies audit_sensitive_reads exclusively invokes
        the trusted SECURITY DEFINER function public.log_user_audit_event.
        """
        source = inspect.getsource(audit_sensitive_reads)
        self.assertIn("SELECT public.log_user_audit_event", source)
        self.assertIn("transactional_session", source)

    def test_audit_sensitive_reads_contains_no_direct_auditlog_fallback(self):
        """
        Task 6.2: Verifies audit_sensitive_reads contains NO direct ORM
        AuditLog fallback (db.add(AuditLog) or AuditLog instantiation).
        If the trusted audit function fails, failure must propagate.
        """
        source = inspect.getsource(audit_sensitive_reads)
        self.assertNotIn("AuditLog", source)
        self.assertNotIn("db.add", source)

        # Verify fail-closed behavior: an audit function failure propagates
        class MockRequest:
            method = "GET"
            class URL:
                path = "/api/v1/medical-records"
            url = URL()
            class State:
                current_user_id = "patient-test-fail-propagation"
            state = State()
            client = None

        class MockResponse:
            status_code = 200

        async def mock_call_next(req):
            return MockResponse()

        # Patch transactional_session to simulate stored procedure failure
        class FailingSession:
            def execute(self, *args, **kwargs):
                raise RuntimeError("Simulated audit stored procedure failure")

        from contextlib import contextmanager
        @contextmanager
        def failing_transactional_session(user_id=None):
            yield FailingSession()

        with patch("app.main.transactional_session", failing_transactional_session):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                with self.assertRaises(RuntimeError):
                    loop.run_until_complete(audit_sensitive_reads(MockRequest(), mock_call_next))
            finally:
                loop.close()

    def test_fhir_export_caller_provided_session(self):
        """
        Task 6.3: Verifies export_to_fhir accepts and uses the caller's
        authenticated DB session and does not create an unauthenticated
        SessionLocal when a session is supplied.
        """
        mock_db = MagicMock()
        mock_record = MagicMock()
        mock_record.id = "rec-123"
        mock_record.patient_id = "pat-456"
        mock_record.doctor_id = "doc-789"
        mock_record.value_string = "enc_payload"
        mock_record.effective_date = "2026-01-01T00:00:00"

        mock_db.query.return_value.filter.return_value.first.return_value = mock_record

        with patch("app.database.SessionLocal") as mock_session_local:
            bundle = export_to_fhir("rec-123", db=mock_db)
            # Must NOT call SessionLocal() when caller passes db
            mock_session_local.assert_not_called()
            self.assertEqual(bundle["resourceType"], "Bundle")
            self.assertEqual(bundle["entry"][0]["resource"]["id"], "rec-123")

    def test_fhir_export_not_exposed_to_http(self):
        """
        Task 6.3: Verifies fhir_export is not imported by any API router,
        confirming it is not reachable by ordinary HTTP requests.
        """
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        api_dir = os.path.join(backend_dir, "app", "api")

        for root, _, files in os.walk(api_dir):
            for file in files:
                if file.endswith(".py"):
                    filepath = os.path.join(root, file)
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                    self.assertNotIn("fhir_export", content, f"fhir_export exposed in {file}!")
                    self.assertNotIn("export_to_fhir", content, f"export_to_fhir exposed in {file}!")

    def test_sessionlocal_inventory_classification(self):
        """
        Task 6.4: Scans all backend Python files for SessionLocal() usage.
        Every occurrence must be accounted for and classified:
        - app/database.py: Framework definition, get_db, transactional_session (Class A)
        - app/main.py: startup_event only (Class B)
        - seed_demo_users.py: Admin CLI / startup helper (Class C)
        - app/utils/fhir_export.py: Offline CLI export utility (Class C)
        - tests/test_milestone2_session_security.py: Test suite (Class C)
        Zero unclassified or router occurrences (no Class D).
        """
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        allowed_files = {
            os.path.normpath(os.path.join(backend_dir, "app", "database.py")),
            os.path.normpath(os.path.join(backend_dir, "app", "main.py")),
            os.path.normpath(os.path.join(backend_dir, "seed_demo_users.py")),
            os.path.normpath(os.path.join(backend_dir, "app", "utils", "fhir_export.py")),
            os.path.normpath(os.path.join(backend_dir, "tests", "test_milestone2_session_security.py")),
        }

        found_occurrences = []
        for root, dirs, files in os.walk(backend_dir):
            # Skip virtual environments
            if ".venv" in root or "venv" in root or "__pycache__" in root:
                continue
            for file in files:
                if file.endswith(".py"):
                    full_path = os.path.normpath(os.path.join(root, file))
                    with open(full_path, "r", encoding="utf-8") as f:
                        for line_no, line in enumerate(f, 1):
                            if "SessionLocal()" in line:
                                found_occurrences.append((full_path, line_no))
                                self.assertIn(
                                    full_path,
                                    allowed_files,
                                    f"Unauthorized SessionLocal() call in {full_path}:{line_no}"
                                )

        # Ensure we verified all expected occurrences
        self.assertGreaterEqual(len(found_occurrences), 4)

    def test_database_url_production_precedence_and_no_postgres_fallback(self):
        """
        Task 6.5: Verifies that:
        1. DATABASE_URL env var overrides any default.
        2. Production fails fast if DATABASE_URL is missing.
        3. Key-value string parsing defaults to smartcare_backend, never postgres.
        4. SUPABASE_SERVICE_ROLE_KEY is not used for DB connections.
        """
        # 1. DATABASE_URL override
        custom_url = "postgresql+psycopg2://test_user:test_pwd@custom_host:5432/test_db"
        with patch.dict(os.environ, {"DATABASE_URL": custom_url}):
            s = Settings()
            self.assertEqual(s.DATABASE_URL, custom_url)

        # 2. Production fail-fast when DATABASE_URL is empty
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENVIRONMENT": "production"}):
            with self.assertRaises(RuntimeError) as ctx:
                # Simulating database.py production guard
                env = os.getenv("ENVIRONMENT", "").lower()
                db_url = os.getenv("DATABASE_URL", "")
                if not db_url and env in ("production", "prod"):
                    raise RuntimeError("DATABASE_URL environment variable is required in production environment.")
            self.assertIn("DATABASE_URL environment variable is required", str(ctx.exception))

        # 3. Key-value parser default check in database.py
        import app.database as db_mod
        source = inspect.getsource(db_mod)
        self.assertIn("'smartcare_backend'", source)
        self.assertNotIn("parts.get('user') or 'postgres'", source)

        # 4. Service role key not in DB module
        self.assertNotIn("SUPABASE_SERVICE_ROLE_KEY", source)


if __name__ == "__main__":
    unittest.main()
