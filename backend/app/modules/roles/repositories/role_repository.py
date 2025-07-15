# /backend/app/modules/roles/repositories/role_repository.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any, Optional

class RoleRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.roles

    async def find_one_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"name": name})

    async def insert_one(self, role_doc: Dict[str, Any]):
        await self.collection.insert_one(role_doc)

    async def find_all(self) -> List[Dict[str, Any]]:
        cursor = self.collection.find({}, {"_id": 0})
        return await cursor.to_list(length=None)