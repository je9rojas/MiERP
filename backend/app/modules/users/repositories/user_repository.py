# /backend/app/modules/users/repositories/user_repository.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from bson import ObjectId

class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.users

    async def find_one_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"username": username})

    async def find_one_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"_id": ObjectId(user_id)})

    async def find_all(self) -> List[Dict[str, Any]]:
        cursor = self.collection.find({})
        return await cursor.to_list(length=None) # length=None para obtener todos

    async def insert_one(self, user_doc: Dict[str, Any]) -> ObjectId:
        result = await self.collection.insert_one(user_doc)
        return result.inserted_id

    async def update_one_by_username(self, username: str, update_data: Dict[str, Any]) -> int:
        result = await self.collection.update_one({"username": username}, {"$set": update_data})
        return result.matched_count