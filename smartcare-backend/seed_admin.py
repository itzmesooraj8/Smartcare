#!/usr/bin/env python3
"""Promote an existing user to admin.

Run once locally: python seed_admin.py
"""
import logging
from app.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


def main():
    email = input("Enter the email address to promote to admin: ").strip()
    if not email:
        logger.error("No email provided; aborting.")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.error("User not found for email provided")
            return
        user.role = "admin"
        db.add(user)
        db.commit()
        logger.info("User promoted to admin")
    except Exception as exc:
        db.rollback()
        logger.exception("Error promoting user")
    finally:
        db.close()


if __name__ == "__main__":
    main()
