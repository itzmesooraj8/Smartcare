import os
import unittest
from unittest.mock import patch

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.config import _load_keys, _validate_keypair


class RSAKeyLifecycleTests(unittest.TestCase):
    def _keypair(self):
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private = key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ).decode()
        public = key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()
        return private, public

    def test_production_missing_keys_fails_fast(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "production", "RENDER": "false"}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "requires PRIVATE_KEY and PUBLIC_KEY"):
                _load_keys()

    def test_render_missing_keys_fails_fast(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "development", "RENDER": "true"}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "requires PRIVATE_KEY and PUBLIC_KEY"):
                _load_keys()

    def test_valid_environment_keys_load_and_match(self):
        private, public = self._keypair()
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "RENDER": "true",
            "PRIVATE_KEY": private.replace("\n", "\\n"),
            "PUBLIC_KEY": public.replace("\n", "\\n"),
        }, clear=True):
            loaded_private, loaded_public = _load_keys()
        self.assertIn("BEGIN PRIVATE KEY", loaded_private)
        self.assertIn("BEGIN PUBLIC KEY", loaded_public)

    def test_mismatched_keys_rejected(self):
        private, _ = self._keypair()
        _, public = self._keypair()
        with self.assertRaisesRegex(RuntimeError, "matching keypair"):
            _validate_keypair(private, public)

    def test_nonproduction_retains_ephemeral_fallback(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "development", "RENDER": "false"}, clear=True):
            private, public = _load_keys()
        self.assertIn("BEGIN PRIVATE KEY", private)
        self.assertIn("BEGIN PUBLIC KEY", public)

    def test_nonproduction_never_requires_render_secrets(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "test", "RENDER": "false"}, clear=True):
            private, public = _load_keys()
        self.assertTrue(private and public)


if __name__ == "__main__":
    unittest.main()
