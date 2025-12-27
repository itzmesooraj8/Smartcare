#!/usr/bin/env python3
"""Promote an existing user to admin.

Run once locally: python seed_admin.py
"""
from app.database import SessionLocal
from app.models.user import User


def main():
    email = input("Enter the email address to promote to admin: ").strip()
    if not email:
        print("No email provided; aborting.")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print("User not found")
            return
        user.role = "admin"
        db.add(user)
        db.commit()
        print("Success")
    except Exception as exc:
        db.rollback()
        print("Error promoting user:", exc)
    finally:
        db.close()


if __name__ == "__main__":
    main()
