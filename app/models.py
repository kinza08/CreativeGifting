from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Services ----------

class ServiceCreate(BaseModel):
    title: str
    description: str
    price_range: Optional[str] = None
    icon: Optional[str] = None  # e.g. an emoji or icon name the frontend maps to an icon
    image_url: Optional[str] = None  # returned by POST /admin/services/upload-image


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_range: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None


class ServiceOut(ServiceCreate):
    id: str


# ---------- Reviews ----------

class ReviewCreate(BaseModel):
    name: str
    message: str
    rating: int = Field(ge=1, le=5)


class ReviewOut(BaseModel):
    id: str
    name: str
    message: str
    rating: int
    created_at: datetime


# ---------- Contact messages ----------

class MessageCreate(BaseModel):
    name: str
    contact: str  # email or phone, kept as free text so either works
    message: str


class MessageOut(MessageCreate):
    id: str
    created_at: datetime


# ---------- Social links ----------

class SocialLinkCreate(BaseModel):
    platform: str  # e.g. "instagram", "linkedin", "github"
    url: str


class SocialLinkUpdate(BaseModel):
    url: str


class SocialLinkOut(SocialLinkCreate):
    id: str


# ---------- Admin auth ----------

class AdminLogin(BaseModel):
    username: str
    password: str


class AdminChangePassword(BaseModel):
    current_password: str
    new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"