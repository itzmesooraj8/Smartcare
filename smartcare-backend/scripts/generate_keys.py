#!/usr/bin/env python3
"""Generate RSA-4096 PEMs and a Fernet ENCRYPTION_KEY for local testing.

Usage: python scripts/generate_keys.py
Outputs: private_key.pem, public_key.pem and prints ENCRYPTION_KEY to stdout.
"""
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet

# Generate RSA-4096 private key
private_key = rsa.generate_private_key(public_exponent=65537, key_size=4096, backend=default_backend())

# Serialize private key (PEM, no encryption) and save
priv_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
)
with open("private_key.pem", "wb") as f:
    f.write(priv_pem)

# Serialize public key (PEM) and save
pub_pem = private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
)
with open("public_key.pem", "wb") as f:
    f.write(pub_pem)

# Generate Fernet-compatible key for ENCRYPTION_KEY
fernet_key = Fernet.generate_key()
print("WROTE: private_key.pem, public_key.pem")
print("ENCRYPTION_KEY (copy and store securely):\n" + fernet_key.decode())
print("\nNote: do NOT commit these files to git. Use a secret manager for production.")
