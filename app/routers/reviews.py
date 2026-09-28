from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_admin
from app.database import reviews_collection
from app.models import ReviewCreate, ReviewOut

router = APIRouter(tags=["Reviews"])


def serialize_review(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "message": doc["message"],
        "rating": doc["rating"],
        "created_at": doc["created_at"],
    }


# ---- Public ----

@router.get("/reviews", response_model=list[ReviewOut])
async def list_reviews():
    docs = await reviews_collection.find().sort("created_at", -1).to_list(length=500)
    return [serialize_review(doc) for doc in docs]


@router.post("/reviews", response_model=ReviewOut)
async def add_review(review: ReviewCreate):
    doc = review.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await reviews_collection.insert_one(doc)
    saved = await reviews_collection.find_one({"_id": result.inserted_id})
    return serialize_review(saved)


# ---- Admin ----

@router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, admin: str = Depends(get_current_admin)):
    try:
        oid = ObjectId(review_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid review id")

    result = await reviews_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"detail": "Review deleted"}