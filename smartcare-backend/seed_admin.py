#!/usr/bin/env python3
"""
seed_admin.py

Utility to create or promote a user to admin role safely via the application's models.
Run from the `smartcare-backend` directory with the activated virtualenv:

    python seed_admin.py

This will print the generated password when a new user is created. If the user
already exists, their role will be updated to 'admin' and no password will be changed.
"""
from __future__ import annotations

import secrets
import sys
from pathlib import Path

from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Ensure app package is importable (repo layout may require this)
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, engine
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "itzmesooraj8@gmail.com"


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def main() -> None:
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if user:
            print(f"Found existing user {ADMIN_EMAIL}. Promoting to admin role.")
            user_role_before = getattr(user, 'role', None)
            user.role = 'admin'
            db.add(user)
            db.commit()
            print(f"User role updated: {user_role_before} -> {user.role}")
            return

        # Create a secure random password for the seeded admin
        password = secrets.token_urlsafe(18)
        hashed = get_password_hash(password)
        new_user = User(email=ADMIN_EMAIL, hashed_password=hashed, full_name="Administrator", is_active=True)
        # set role attribute if the model supports it
        try:
            setattr(new_user, 'role', 'admin')
        except Exception:
            pass

        db.add(new_user)
        db.commit()
        print(f"Created admin user: {ADMIN_EMAIL}")
        print("Generated password (store this securely):")
        print(password)
    except Exception as exc:
        print("Failed to seed admin:", exc)
    finally:
        db.close()


if __name__ == '__main__':
    main()
