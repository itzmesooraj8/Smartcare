# app/tasks/reminders.py
from app.core.celery_app import celery_app
from app.services.email import send_email  # implement your email service
from app.db.session import SessionLocal
from app.models.notification import Notification
from sqlalchemy.orm import Session

@celery_app.task
def send_appointment_reminder(user_email: str, doctor_id: str, appointment_time: str):
    # send email or sms
    # create notification DB entry for audit/history
    db: Session = SessionLocal()
    try:
        notif = Notification(user_id=None, type="email", payload={"to": user_email, "message": f"Your appointment ... {appointment_time}"}, status="sent")
        db.add(notif)
        db.commit()
    finally:
        db.close()
    # call actual sender
    send_email(to=user_email, subject="Appointment Reminder", body=f"Your appointment at {appointment_time}")
