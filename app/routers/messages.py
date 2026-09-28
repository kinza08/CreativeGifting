from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_admin
from app.database import messages_collection
from app.models import MessageCreate, MessageOut

router = APIRouter(tags=["Messages"])


def serialize_message(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "contact": doc.get("contact", ""),
        "message": doc.get("message", ""),
        "created_at": doc.get("created_at"),
    }
# ---- Public ----

@router.post("/messages", response_model=MessageOut)
async def send_message(message: MessageCreate):
    doc = message.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await messages_collection.insert_one(doc)
    saved = await messages_collection.find_one({"_id": result.inserted_id})
    return serialize_message(saved)


# ---- Admin ----

@router.get("/admin/messages", response_model=list[MessageOut])
async def list_messages(admin: str = Depends(get_current_admin)):
    docs = await messages_collection.find().sort("created_at", -1).to_list(length=500)
    return [serialize_message(doc) for doc in docs]


@router.delete("/admin/messages/{message_id}")
async def delete_message(message_id: str, admin: str = Depends(get_current_admin)):
    try:
        oid = ObjectId(message_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid message id")

    result = await messages_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"detail": "Message deleted"}