# /backend/app/modules/crm/repositories/supplier_repository.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from bson import ObjectId

class SupplierRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.suppliers

    async def find_by_ruc(self, ruc: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"ruc": ruc})

    async def find_by_id(self, supplier_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"_id": ObjectId(supplier_id)})

    async def insert_one(self, supplier_doc: Dict[str, Any]) -> ObjectId:
        result = await self.collection.insert_one(supplier_doc)
        return result.inserted_id

    async def find_all_paginated(self, query: Dict[str, Any], skip: int, page_size: int) -> List[Dict[str, Any]]:
        cursor = self.collection.find(query).skip(skip).limit(page_size)
        return await cursor.to_list(length=page_size)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return await self.collection.count_documents(query)

    async def update_one_by_ruc(self, ruc: str, update_data: Dict[str, Any]) -> int:
        result = await self.collection.update_one({"ruc": ruc}, {"$set": update_data})
        return result.matched_count

    async def deactivate_one_by_ruc(self, ruc: str, update_data: Dict[str, Any]) -> int:
        result = await self.collection.update_one({"ruc": ruc}, {"$set": update_data})
        return result.modified_count