"""
Seed script to create demo users for testing
Run: python seed_demo_users.py
"""
import sys
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.insert(0, '/app')

from app.core.config import settings
from app.models.user import User
from app.database import Base

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Database setup
DATABASE_URL = settings.database_url
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def seed_demo_users():
    """Create demo users for testing"""
    db = SessionLocal()
    
    demo_users = [
        {
            "email": "demo.patient@smartcare.local",
            "full_name": "Demo Patient",
            "password": "DemoPass123!",
            "role": "patient",
            "is_active": True,
        },
        {
            "email": "demo.doctor@smartcare.local",
            "full_name": "Demo Doctor",
            "password": "DemoPass123!",
            "role": "doctor",
            "is_active": True,
        },
        {
            "email": "demo.admin@smartcare.local",
            "full_name": "Demo Admin",
            "password": "DemoPass123!",
            "role": "admin",
            "is_active": True,
        },
    ]
    
    for user_data in demo_users:
        # Check if user exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"✓ User {user_data['email']} already exists")
            continue
        
        # Create new user
        hashed_pwd = hash_password(user_data["password"])
        new_user = User(
            email=user_data["email"],
            full_name=user_data["full_name"],
            hashed_password=hashed_pwd,
            role=user_data["role"],
            is_active=user_data["is_active"],
        )
        db.add(new_user)
        print(f"✓ Created demo user: {user_data['email']} ({user_data['role']})")
    
    db.commit()
    db.close()
    print("\n✅ Demo users seeded successfully!")
    print("\nDemo Credentials:")
    print("  Patient:  demo.patient@smartcare.local / DemoPass123!")
    print("  Doctor:   demo.doctor@smartcare.local / DemoPass123!")
    print("  Admin:    demo.admin@smartcare.local / DemoPass123!")

if __name__ == "__main__":
    try:
        seed_demo_users()
    except Exception as e:
        print(f"❌ Error seeding demo users: {e}")
        sys.exit(1)
