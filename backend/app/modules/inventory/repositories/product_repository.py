# /backend/app/modules/inventory/repositories/product_repository.py
# CAPA DE ACCESO A DATOS PARA LA ENTIDAD PRODUCTO

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from bson import ObjectId

class ProductRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.products

    async def find_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"sku": sku})

    async def find_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"_id": ObjectId(product_id)})

    async def insert_one(self, product_doc: Dict[str, Any]) -> ObjectId:
        result = await self.collection.insert_one(product_doc)
        return result.inserted_id

    async def update_one(self, sku: str, update_data: Dict[str, Any]) -> int:
        result = await self.collection.update_one({"sku": sku}, {"$set": update_data})
        return result.matched_count

    async def deactivate_one(self, sku: str, update_data: Dict[str, Any]) -> int:
        result = await self.collection.update_one({"sku": sku}, {"$set": update_data})
        return result.modified_count

    async def find_all(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Encuentra todos los documentos que coinciden con una consulta, sin paginación."""
        cursor = self.collection.find(query)
        return await cursor.to_list(length=None) # length=None para obtener todos los documentos

    async def find_paginated(self, query: Dict[str, Any], skip: int, page_size: int) -> List[Dict[str, Any]]:
        cursor = self.collection.find(query).skip(skip).limit(page_size)
        return await cursor.to_list(length=page_size)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return await self.collection.count_documents(query)
    
