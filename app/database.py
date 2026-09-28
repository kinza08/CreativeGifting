from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

services_collection = db["services"]
reviews_collection = db["reviews"]
messages_collection = db["messages"]
social_links_collection = db["social_links"]
admin_collection = db["admin"]