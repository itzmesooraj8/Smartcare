from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate
from datetime import datetime

def create_appointment(db: Session, patient_id: int, data: AppointmentCreate):
    # Prevent double booking
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == data.doctor_id,
        Appointment.appointment_time == data.appointment_time,
        Appointment.status == AppointmentStatus.booked
    ).first()

    if existing:
        raise ValueError("This slot is already booked!")

    appointment = Appointment(
        doctor_id=data.doctor_id,
        patient_id=patient_id,
        appointment_time=data.appointment_time,
        status=AppointmentStatus.booked
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

def cancel_appointment(db: Session, appointment_id: int, patient_id: int):
    appt = db.query(Appointment).filter_by(id=appointment_id, patient_id=patient_id).first()
    if not appt:
        raise ValueError("Appointment not found")
    appt.status = AppointmentStatus.cancelled
    db.commit()
    return appt

def reschedule_appointment(db: Session, appointment_id: int, new_time: datetime):
    appt = db.query(Appointment).get(appointment_id)
    if not appt:
        raise ValueError("Appointment not found")

    # Prevent double booking
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appt.doctor_id,
        Appointment.appointment_time == new_time,
        Appointment.status == AppointmentStatus.booked
    ).first()
    if conflict:
        raise ValueError("Slot already booked")

    appt.appointment_time = new_time
    db.commit()
    return appt
