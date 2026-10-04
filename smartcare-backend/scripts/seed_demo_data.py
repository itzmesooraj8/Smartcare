"""
Seed script to create demo/test users for development and local testing.
Explicit execution required:
    python scripts/seed_demo_data.py --environment=development

Never runs automatically during service startup.
"""
import os
import sys
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Explicit Demo Data Seeder for Development")
    parser.add_argument(
        "--environment",
        choices=["development", "test", "local"],
        help="Target environment (strictly non-production)",
    )
    args = parser.parse_args()

    if not args.environment:
        print("[ERROR] Refusing to seed database without explicit non-production environment flag.")
        print("Usage: python scripts/seed_demo_data.py --environment=development")
        sys.exit(1)

    # Ensure parent directory is on sys.path
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    from dotenv import load_dotenv
    env_path = os.path.join(backend_dir, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)

    from passlib.context import CryptContext
    from sqlalchemy.orm import Session
    from app.database import SessionLocal
    from app.models.user import User
    from app.models.medical_record import MedicalRecord
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from app.models.appointment import Appointment

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

    def seed_demo_users() -> dict[str, int]:
        db: Session = SessionLocal()
        created = 0
        existing_count = 0
        try:
            for user_data in get_demo_users():
                existing = db.query(User).filter(User.email == user_data["email"]).first()
                if existing:
                    existing_count += 1
                    continue

                hashed_pwd = hash_password(str(user_data["password"]))
                user = User(
                    email=str(user_data["email"]),
                    password_hash=hashed_pwd,
                    full_name=str(user_data["full_name"]),
                    role=str(user_data["role"]),
                    is_active=bool(user_data["is_active"]),
                )
                db.add(user)
                created += 1

            db.commit()
            return {"created": created, "existing": existing_count}
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    print(f"[*] Seeding demo users in {args.environment} environment...")
    result = seed_demo_users()
    print(f"[+] Seeding complete: created={result['created']} existing={result['existing']}")
