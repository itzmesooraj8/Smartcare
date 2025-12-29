"""Seed script to create fake users (10 patients, 5 doctors).

Run from the smartcare-backend directory:
python -m scripts.seed_fake_users
or
python scripts/seed_fake_users.py
"""
import os
import sys

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
# Ensure package import works when run from this scripts/ directory
ROOT = os.path.dirname(THIS_DIR)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext


def main():
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    session = SessionLocal()
    try:
        created = []
        # Create 10 patients
        for i in range(1, 11):
            email = f"patient{i}@example.com"
            existing = session.query(User).filter(User.email == email).first()
            if existing:
                continue
            u = User(
                email=email,
                hashed_password=pwd_context.hash("Password123!"),
                full_name=f"Patient {i}",
                role="patient",
                is_active=True,
            )
            session.add(u)
            created.append(email)

        # Create 5 doctors
        for i in range(1, 6):
            email = f"doctor{i}@example.com"
            existing = session.query(User).filter(User.email == email).first()
            if existing:
                continue
            u = User(
                email=email,
                hashed_password=pwd_context.hash("DoctorPass123!"),
                full_name=f"Dr. Doctor {i}",
                role="doctor",
                is_active=True,
            )
            session.add(u)
            created.append(email)

        session.commit()
        print(f"Seed complete — created/ensured users:\n  " + "\n  ".join(created))
    except Exception as e:
        session.rollback()
        print("Error running seed:", e)
    finally:
        session.close()


if __name__ == "__main__":
    main()
