"""
Seed script to create demo users for testing
Run: python seed_demo_users.py
"""
import os
import sys
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def get_demo_users() -> list[dict[str, str | bool]]:
    default_password = os.getenv("DEMO_USER_PASSWORD", "demo1234")
    return [
        {
            "email": os.getenv("DEMO_PATIENT_EMAIL", "demo.patient@smartcare.app"),
            "full_name": "Demo Patient",
            "password": os.getenv("DEMO_PATIENT_PASSWORD", default_password),
            "role": "patient",
            "is_active": True,
        },
        {
            "email": os.getenv("DEMO_DOCTOR_EMAIL", "demo.doctor@smartcare.app"),
            "full_name": "Dr. Demo",
            "password": os.getenv("DEMO_DOCTOR_PASSWORD", default_password),
            "role": "doctor",
            "is_active": True,
        },
        {
            "email": os.getenv("DEMO_ADMIN_EMAIL", "demo.admin@smartcare.app"),
            "full_name": "Demo Admin",
            "password": os.getenv("DEMO_ADMIN_PASSWORD", default_password),
            "role": "admin",
            "is_active": True,
        },
    ]

def seed_demo_users(db: Session | None = None) -> dict[str, int]:
    """Create demo users for testing and demos."""
    own_session = db is None
    if db is None:
        db = SessionLocal()

    created = 0
    existing_count = 0

    try:
        for user_data in get_demo_users():
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if existing:
                existing_count += 1
                continue

            hashed_pwd = hash_password(str(user_data["password"]))
            new_user = User(
                email=str(user_data["email"]),
                full_name=str(user_data["full_name"]),
                hashed_password=hashed_pwd,
                role=str(user_data["role"]),
                is_active=bool(user_data["is_active"]),
            )
            db.add(new_user)
            created += 1

        db.commit()
        return {"created": created, "existing": existing_count}
    except Exception:
        db.rollback()
        raise
    finally:
        if own_session:
            db.close()

if __name__ == "__main__":
    try:
        result = seed_demo_users()
        print("\nDemo users seed complete")
        print(f"Created: {result['created']}")
        print(f"Already existed: {result['existing']}")
        print("\nDemo Credentials:")
        for user in get_demo_users():
            print(f"  {user['role']}: {user['email']} / {user['password']}")
    except Exception as e:
        print(f"❌ Error seeding demo users: {e}")
        sys.exit(1)
