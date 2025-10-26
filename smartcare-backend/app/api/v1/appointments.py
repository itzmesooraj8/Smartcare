# app/api/v1/appointments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, update
import sqlalchemy as sa
from datetime import timedelta
from app.db.base_class import Base
from app.models.user import User, UserRole
from app.db.session import get_db
from app.models.availability import Availability
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreateOut, AppointmentOut
from app.core.roles import require_role
from app.tasks.reminders import send_appointment_reminder  # celery task

router = APIRouter()

@router.post("/book", response_model=AppointmentOut)
def book_slot(payload: AppointmentCreateOut, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.patient]))):
    slot_id = payload.slot_id
    # transactional booking to avoid race conditions
    try:
        with db.begin():
            # lock the row
            slot = db.execute(select(Availability).where(Availability.id == slot_id).with_for_update()).scalar_one_or_none()
            if not slot:
                raise HTTPException(status_code=404, detail="Slot not found")
            if slot.is_booked:
                raise HTTPException(status_code=409, detail="Slot already booked")

            appt = Appointment(
                doctor_id=slot.doctor_id,
                patient_id=current_user.id,
                slot_id=slot.id,
                appointment_time=slot.slot_start,
                status=AppointmentStatus.booked,
            )
            db.add(appt)
            slot.is_booked = True
            db.add(slot)
            db.flush()
            db.refresh(appt)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Booking failed")

    # schedule reminder 30 min before
    reminder_dt = appt.appointment_time - timedelta(minutes=30)
    if reminder_dt:
        # use celery task with eta if in future
        try:
            send_appointment_reminder.apply_async(
                args=[str(current_user.email), str(appt.doctor_id), appt.appointment_time.isoformat()],
                eta=reminder_dt
            )
        except Exception:
            # log celery scheduling failure to audit/notification
            pass

    return appt

@router.post("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.patient, UserRole.doctor]))):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    # permit patient cancels own appointments or doctor cancels own appointments
    if current_user.role == UserRole.patient and appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if current_user.role == UserRole.doctor and appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    appt.status = AppointmentStatus.cancelled
    appt.cancelled_at = sa.func.now()
    # free the slot if linked
    if appt.slot_id:
        slot = db.query(Availability).filter(Availability.id == appt.slot_id).first()
        if slot:
            slot.is_booked = False
            db.add(slot)
    db.add(appt)
    db.commit()
    return {"detail": "cancelled"}
