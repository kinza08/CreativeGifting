from fastapi import APIRouter, Depends, HTTPException

from app.auth import (
    create_access_token,
    get_current_admin,
    hash_password,
    verify_password,
)
from app.database import admin_collection
from app.models import AdminChangePassword, AdminLogin, Token

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login", response_model=Token)
async def login(credentials: AdminLogin):
    admin_doc = await admin_collection.find_one({"username": credentials.username})
    if not admin_doc or not verify_password(credentials.password, admin_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token(subject=admin_doc["username"])
    return Token(access_token=token)


@router.post("/change-password")
async def change_password(data: AdminChangePassword, admin: str = Depends(get_current_admin)):
    admin_doc = await admin_collection.find_one({"username": admin})
    if not admin_doc or not verify_password(data.current_password, admin_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    await admin_collection.update_one(
        {"username": admin},
        {"$set": {"password_hash": hash_password(data.new_password)}},
    )
    return {"detail": "Password updated"}