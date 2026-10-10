#!/usr/bin/env python3
"""Generate a local 2048-bit RSA keypair for SmartCare production secret ingestion.

The generated files are intentionally local-only and are covered by repository
.gitignore rules. This script never prints private key material to stdout.
"""
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


ROOT = Path(__file__).resolve().parents[1] / "smartcare-backend"
PRIVATE_PATH = ROOT / "private_key.pem"
PUBLIC_PATH = ROOT / "public_key.pem"


def main() -> None:
    if PRIVATE_PATH.exists() or PUBLIC_PATH.exists():
        raise SystemExit(
            "Refusing to overwrite an existing keypair. Remove the local files "
            "only if you intentionally want to rotate keys."
        )

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    PRIVATE_PATH.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    PUBLIC_PATH.write_bytes(
        key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )

    try:
        PRIVATE_PATH.chmod(0o600)
        PUBLIC_PATH.chmod(0o644)
    except OSError:
        # Windows does not expose POSIX permissions in the same way.
        pass

    print(f"Generated 2048-bit RSA private key: {PRIVATE_PATH}")
    print(f"Generated RSA public key: {PUBLIC_PATH}")
    print("Upload the contents to Render Environment Secrets as PRIVATE_KEY and PUBLIC_KEY.")
    print("Do not commit, paste, or log the private key.")


if __name__ == "__main__":
    main()
