from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_admin
from app.database import social_links_collection
from app.models import SocialLinkCreate, SocialLinkOut, SocialLinkUpdate

router = APIRouter(tags=["Social Links"])


def serialize_link(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "platform": doc["platform"],
        "url": doc["url"],
    }


# ---- Public ----

@router.get("/social", response_model=list[SocialLinkOut])
async def list_social_links():
    docs = await social_links_collection.find().to_list(length=50)
    return [serialize_link(doc) for doc in docs]


# ---- Admin ----

@router.post("/admin/social", response_model=SocialLinkOut)
async def add_social_link(link: SocialLinkCreate, admin: str = Depends(get_current_admin)):
    existing = await social_links_collection.find_one({"platform": link.platform})
    if existing:
        raise HTTPException(status_code=400, detail="That platform already has a link — edit it instead")

    result = await social_links_collection.insert_one(link.model_dump())
    doc = await social_links_collection.find_one({"_id": result.inserted_id})
    return serialize_link(doc)


@router.put("/admin/social/{link_id}", response_model=SocialLinkOut)
async def update_social_link(link_id: str, link: SocialLinkUpdate, admin: str = Depends(get_current_admin)):
    try:
        oid = ObjectId(link_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid link id")

    result = await social_links_collection.update_one({"_id": oid}, {"$set": {"url": link.url}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")

    doc = await social_links_collection.find_one({"_id": oid})
    return serialize_link(doc)


@router.delete("/admin/social/{link_id}")
async def delete_social_link(link_id: str, admin: str = Depends(get_current_admin)):
    try:
        oid = ObjectId(link_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid link id")

    result = await social_links_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"detail": "Social link deleted"}