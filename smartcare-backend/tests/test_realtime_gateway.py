import unittest
from unittest.mock import MagicMock, patch, AsyncMock

from fastapi import WebSocketDisconnect

from app.realtime import _authenticate_cookie, RealtimeManager


class RealtimeGatewayTests(unittest.TestCase):
    def test_missing_credentials_is_rejected(self):
        websocket = MagicMock()
        websocket.cookies = {}
        websocket.headers = {}
        with self.assertRaisesRegex(ValueError, "missing access token"):
            _authenticate_cookie(websocket)

    def test_pre_auth_scope_is_rejected(self):
        websocket = MagicMock()
        websocket.cookies = {"access_token": "token"}
        websocket.headers = {}
        with patch("app.realtime.verify_access_token", return_value={
            "sub": "user-1",
            "scopes": ["pre_auth"],
        }):
            with self.assertRaisesRegex(PermissionError, "full_access"):
                _authenticate_cookie(websocket)

    def test_full_access_cookie_is_accepted(self):
        websocket = MagicMock()
        websocket.cookies = {"access_token": "token"}
        websocket.headers = {}
        payload = {"sub": "user-1", "role": "patient", "scopes": ["full_access"]}
        with patch("app.realtime.verify_access_token", return_value=payload):
            self.assertEqual(_authenticate_cookie(websocket), payload)

    def test_full_access_auth_header_is_accepted(self):
        websocket = MagicMock()
        websocket.cookies = {}
        websocket.headers = {"authorization": "Bearer header-token"}
        payload = {"sub": "user-1", "role": "patient", "scopes": ["full_access"]}
        with patch("app.realtime.verify_access_token", return_value=payload):
            self.assertEqual(_authenticate_cookie(websocket), payload)

    def test_invalid_jwt_is_rejected(self):
        from jose import JWTError
        websocket = MagicMock()
        websocket.cookies = {"access_token": "invalid-token"}
        websocket.headers = {}
        with patch("app.realtime.verify_access_token", side_effect=JWTError("Invalid signature")):
            with self.assertRaisesRegex(ValueError, "invalid access token"):
                _authenticate_cookie(websocket)

    def test_expired_jwt_is_rejected(self):
        from jose import ExpiredSignatureError
        websocket = MagicMock()
        websocket.cookies = {"access_token": "expired-token"}
        websocket.headers = {}
        with patch("app.realtime.verify_access_token", side_effect=ExpiredSignatureError("Token expired")):
            with self.assertRaisesRegex(ValueError, "invalid access token"):
                _authenticate_cookie(websocket)

    def test_manager_tracks_user_connections(self):
        manager = RealtimeManager()
        websocket = MagicMock()
        manager.connections["user-1"].add(websocket)
        manager.websocket_users[websocket] = "user-1"
        self.assertEqual(manager.user_id_for(websocket), "user-1")
        manager.disconnect(websocket)
        self.assertIsNone(manager.user_id_for(websocket))
        self.assertNotIn("user-1", manager.connections)

    def test_publish_appointment_lifecycle_events_and_recipient_isolation(self):
        import asyncio
        import json
        from unittest.mock import AsyncMock
        from app.realtime import publish_appointment, manager

        # Setup mock sockets for Patient A, Doctor A, and Patient B
        ws_patient_a = AsyncMock()
        ws_doctor_a = AsyncMock()
        ws_patient_b = AsyncMock()

        manager.connections["patient-1"].add(ws_patient_a)
        manager.connections["doctor-1"].add(ws_doctor_a)
        manager.connections["patient-2"].add(ws_patient_b)

        appt_data = {
            "id": "appt-100",
            "doctor_id": "doctor-1",
            "patient_id": "patient-1",
            "status": "booked",
            "reason": "Routine Checkup",
        }

        try:
            # 1. Test appointment created event
            asyncio.run(publish_appointment(appt_data, {"patient-1", "doctor-1"}, event_type="created"))

            # Verify Patient A received created event
            ws_patient_a.send_text.assert_called_once()
            received_a = json.loads(ws_patient_a.send_text.call_args[0][0])
            self.assertEqual(received_a["type"], "appointment")
            self.assertEqual(received_a["event"], "created")
            self.assertEqual(received_a["data"]["id"], "appt-100")

            # Verify Doctor A received created event
            ws_doctor_a.send_text.assert_called_once()
            received_doc = json.loads(ws_doctor_a.send_text.call_args[0][0])
            self.assertEqual(received_doc["event"], "created")

            # Verify Patient B received ZERO events (isolation)
            ws_patient_b.send_text.assert_not_called()

            # 2. Test appointment cancelled lifecycle event
            ws_patient_a.reset_mock()
            ws_doctor_a.reset_mock()
            ws_patient_b.reset_mock()

            appt_data["status"] = "cancelled"
            asyncio.run(publish_appointment(appt_data, {"patient-1", "doctor-1"}, event_type="cancelled"))

            received_cancelled = json.loads(ws_patient_a.send_text.call_args[0][0])
            self.assertEqual(received_cancelled["event"], "cancelled")
            self.assertEqual(received_cancelled["data"]["status"], "cancelled")
            ws_patient_b.send_text.assert_not_called()

        finally:
            manager.connections["patient-1"].discard(ws_patient_a)
            manager.connections["doctor-1"].discard(ws_doctor_a)
            manager.connections["patient-2"].discard(ws_patient_b)

    def test_create_appointment_commit_before_broadcast_ordering(self):
        import asyncio
        from datetime import datetime
        from app.api.v1.appointments import create_appointment, AppointmentCreate
        from fastapi import HTTPException

        payload = AppointmentCreate(
            doctor_id="doctor-1",
            appointment_time=datetime(2026, 12, 1, 10, 0),
            reason="Checkup",
            type="video"
        )

        # Case 1: Database failure causes rollback, NO broadcast is sent
        mock_db_fail = MagicMock()
        mock_db_fail.execute.return_value.first.return_value = None  # No double booking
        mock_db_fail.commit.side_effect = Exception("Simulated DB connection failure during commit")

        with patch("app.realtime.publish_appointment", new_callable=AsyncMock) as mock_publish:
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(create_appointment(payload, user_id="patient-1", db=mock_db_fail))
            self.assertEqual(ctx.exception.status_code, 500)
            mock_db_fail.rollback.assert_called_once()
            mock_publish.assert_not_called()  # Guaranteed: zero realtime emission on rollback

        # Case 2: Database commit succeeds, canonical event is broadcast
        mock_db_success = MagicMock()
        # First query (double booking check) -> None
        # Second query (INSERT RETURNING) -> row
        now = datetime(2026, 12, 1, 10, 0)
        mock_res_select = MagicMock()
        mock_res_select.first.return_value = None
        mock_res_insert = MagicMock()
        mock_res_insert.first.return_value = ("appt-999", "doctor-1", "patient-1", now, "booked", "Checkup", now)
        mock_db_success.execute.side_effect = [mock_res_select, mock_res_insert]

        with patch("app.realtime.publish_appointment", new_callable=AsyncMock) as mock_publish:
            result = asyncio.run(create_appointment(payload, user_id="patient-1", db=mock_db_success))
            mock_db_success.commit.assert_called_once()
            self.assertEqual(result["id"], "appt-999")
            self.assertEqual(result["status"], "booked")
            mock_publish.assert_called_once_with(
                result,
                {"patient-1", "doctor-1"},
                event_type="created",
            )


if __name__ == "__main__":
    unittest.main()

