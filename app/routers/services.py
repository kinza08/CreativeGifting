import uuid
from pathlib import Path

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.auth import get_current_admin
from app.database import services_collection
from app.models import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(tags=["Services"])

UPLOAD_DIR = Path("app/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


def serialize_service(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "description": doc["description"],
        "price_range": doc.get("price_range"),
        "icon": doc.get("icon"),
        "image_url": doc.get("image_url"),
    }


# ---- Public ----

@router.get("/services", response_model=list[ServiceOut])
async def list_services():
    docs = await services_collection.find().to_list(length=200)
    return [serialize_service(doc) for doc in docs]


# ---- Admin ----

@router.post("/admin/services/upload-image")
async def upload_service_image(
    file: UploadFile = File(...),
    admin: str = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP or GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5MB")

    extension = Path(file.filename or "").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with open(destination, "wb") as out_file:
        out_file.write(contents)

    return {"url": f"/static/uploads/{filename}"}


@router.post("/admin/services", response_model=ServiceOut)
async def create_service(service: ServiceCreate, admin: str = Depends(get_current_admin)):
    result = await services_collection.insert_one(service.model_dump())
    doc = await services_collection.find_one({"_id": result.inserted_id})
    return serialize_service(doc)


@router.put("/admin/services/{service_id}", response_model=ServiceOut)
async def update_service(service_id: str, service: ServiceUpdate, admin: str = Depends(get_current_admin)):
    try:
        oid = ObjectId(service_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid service id")

    update_data = {k: v for k, v in service.model_dump().items() if v is not None}
    if update_data:
        await services_collection.update_one({"_id": oid}, {"$set": update_data})

    doc = await services_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Service not found")
    return serialize_service(doc)


@router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, admin: str = Depends(get_current_admin)):
    try:
        oid = ObjectId(service_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid service id")

    result = await services_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"detail": "Service deleted"}