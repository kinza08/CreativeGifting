from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import hash_password
from app.config import settings
from app.database import admin_collection
from app.routers import admin, messages, reviews, services, social


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed the first admin account if the admin collection is empty.
    # After first login, use /admin/change-password to set a real password.
    existing = await admin_collection.find_one({})
    if not existing:
        await admin_collection.insert_one(
            {
                "username": settings.ADMIN_USERNAME,
                "password_hash": hash_password(settings.ADMIN_PASSWORD),
            }
        )
    yield


app = FastAPI(title="Portfolio API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router)
app.include_router(reviews.router)
app.include_router(messages.router)
app.include_router(social.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Portfolio API"}