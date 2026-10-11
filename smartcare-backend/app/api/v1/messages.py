import logging
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, and_, text
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database import get_db
from app.models.message import Message
from app.models.user import User
from app.realtime import publish_message

logger = logging.getLogger("smartcare.messages")
router = APIRouter()


class MessageCreate(BaseModel):
    receiver_id: str = Field(..., description="Recipient user UUID")
    text: str = Field(..., min_length=1, max_length=5000, description="Message body text")
    room_id: Optional[str] = Field(None, description="Optional room or conversation id")


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    room_id: Optional[str] = None
    text: str
    content: str
    is_read: bool
    created_at: Optional[str] = None


@router.post("/", response_model=MessageResponse, status_code=201)
async def send_message(
    payload: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    sender_id = str(user_id)
    receiver_id = str(payload.receiver_id)

    # Validate that recipient exists in the system
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        # Fallback check via raw SQL to handle RLS visibility
        receiver_exists = db.execute(
            text("SELECT 1 FROM public.users WHERE id = :rid LIMIT 1"),
            {"rid": receiver_id}
        ).scalar()
        if not receiver_exists:
            raise HTTPException(status_code=404, detail="Recipient user not found")

    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty")

    msg_id = str(uuid.uuid4())
    insert_sql = text("""
        INSERT INTO public.messages (id, sender_id, receiver_id, room_id, text, is_read, created_at)
        VALUES (:id, :sender_id, :receiver_id, :room_id, :text, false, now())
        RETURNING id, sender_id, receiver_id, room_id, text, is_read, created_at;
    """)

    try:
        res = db.execute(insert_sql, {
            "id": msg_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "room_id": payload.room_id,
            "text": clean_text,
        })
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to persist message")
        raise HTTPException(status_code=500, detail="Failed to persist message") from exc

    row = res.first()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to retrieve persisted message")

    canonical_event = {
        "id": str(row[0]),
        "sender_id": str(row[1]),
        "receiver_id": str(row[2]),
        "room_id": row[3],
        "text": row[4],
        "content": row[4],
        "is_read": bool(row[5]),
        "created_at": row[6].isoformat() if row[6] is not None else None,
    }

    # Authoritative server-mediated realtime broadcast: sender + recipient only
    try:
        await publish_message(
            canonical_event,
            {sender_id, receiver_id},
        )
    except Exception:
        logger.exception("Failed to broadcast realtime message event")

    return canonical_event


@router.get("/", response_model=List[MessageResponse])
def get_user_messages(
    peer_id: Optional[str] = Query(None, description="Filter conversation with specific peer"),
    room_id: Optional[str] = Query(None, description="Filter messages in specific room"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    current_uid = str(user_id)

    # Base query: messages where user is sender or receiver
    conditions = [
        or_(Message.sender_id == current_uid, Message.receiver_id == current_uid)
    ]

    if peer_id:
        conditions.append(
            or_(
                and_(Message.sender_id == current_uid, Message.receiver_id == peer_id),
                and_(Message.sender_id == peer_id, Message.receiver_id == current_uid),
            )
        )

    if room_id:
        conditions.append(Message.room_id == room_id)

    rows = (
        db.query(Message)
        .filter(and_(*conditions))
        .order_by(Message.created_at.asc())
        .limit(200)
        .all()
    )

    results = []
    for m in rows:
        results.append({
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "receiver_id": str(m.receiver_id),
            "room_id": m.room_id,
            "text": m.text,
            "content": m.text,
            "is_read": bool(m.is_read),
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })
    return results


@router.patch("/{message_id}/read", status_code=200)
def mark_message_read(
    message_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if str(msg.receiver_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Only recipient can mark message as read")

    msg.is_read = True
    db.commit()
    return {"id": str(msg.id), "is_read": True}
