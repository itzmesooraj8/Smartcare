import unittest
from unittest.mock import MagicMock, patch

from fastapi import WebSocketDisconnect

from app.realtime import _authenticate_cookie, RealtimeManager


class RealtimeGatewayTests(unittest.TestCase):
    def test_missing_cookie_is_rejected(self):
        websocket = MagicMock()
        websocket.cookies = {}
        with self.assertRaisesRegex(ValueError, "missing access token"):
            _authenticate_cookie(websocket)

    def test_pre_auth_scope_is_rejected(self):
        websocket = MagicMock()
        websocket.cookies = {"access_token": "token"}
        with patch("app.realtime.verify_access_token", return_value={
            "sub": "user-1",
            "scopes": ["pre_auth"],
        }):
            with self.assertRaisesRegex(PermissionError, "full_access"):
                _authenticate_cookie(websocket)

    def test_full_access_cookie_is_accepted(self):
        websocket = MagicMock()
        websocket.cookies = {"access_token": "token"}
        payload = {"sub": "user-1", "role": "patient", "scopes": ["full_access"]}
        with patch("app.realtime.verify_access_token", return_value=payload):
            self.assertEqual(_authenticate_cookie(websocket), payload)

    def test_manager_tracks_user_connections(self):
        manager = RealtimeManager()
        websocket = MagicMock()
        manager.connections["user-1"].add(websocket)
        manager.websocket_users[websocket] = "user-1"
        self.assertEqual(manager.user_id_for(websocket), "user-1")
        manager.disconnect(websocket)
        self.assertIsNone(manager.user_id_for(websocket))
        self.assertNotIn("user-1", manager.connections)


if __name__ == "__main__":
    unittest.main()
