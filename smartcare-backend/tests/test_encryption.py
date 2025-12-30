import os
from cryptography.fernet import Fernet

import importlib

# Set up a valid key before importing the module
os.environ['ENCRYPTION_KEY'] = Fernet.generate_key().decode()

encryption = importlib.import_module('app.core.encryption')


def test_encrypt_decrypt_roundtrip():
    plaintext = 'secret-data-123'
    token = encryption.encrypt_data(plaintext)
    assert token != plaintext
    out = encryption.decrypt_data(token)
    assert out == plaintext


def test_decrypt_with_bad_token_returns_marker():
    bad = 'not-a-valid-token'
    out = encryption.decrypt_data(bad)
    assert out == '[decryption-error]'
