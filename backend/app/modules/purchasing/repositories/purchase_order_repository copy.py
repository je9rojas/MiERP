# backend/app/modules/purchasing/repositories/purchase_order_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Compra' (Purchase Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'purchase_orders' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para soportar opcionalmente sesiones transaccionales de MongoDB.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import List, Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class PurchaseOrderRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de órdenes de compra.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """Inicializa el repositorio con una instancia de la base de datos."""
        self.collection = db.purchase_orders

    async def insert_one(self, order_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """Inserta un nuevo documento de orden de compra."""
        result = await self.collection.insert_one(order_doc, session=session)
        return result.inserted_id

    async def find_by_id(self, order_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Busca una única orden de compra por su ObjectId de MongoDB."""
        try:
            return await self.collection.find_one({"_id": ObjectId(order_id)}, session=session)
        except InvalidId:
            return None

    async def find_one_sorted(self, sort_options: List, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra el primer documento según un criterio de ordenamiento."""
        return await self.collection.find_one(sort=sort_options, session=session)

    async def find_all_paginated(
        self,
        query: Dict[str, Any],
        skip: int,
        limit: int,
        sort_options: Optional[List] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """Encuentra múltiples documentos con paginación y ordenamiento."""
        cursor = self.collection.find(query, session=session)
        if sort_options:
            cursor = cursor.sort(sort_options)
        
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(self, query: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Cuenta el número total de documentos que coinciden con una consulta."""
        return await self.collection.count_documents(query, session=session)

    async def update_one_by_id(self, order_id: str, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Actualiza un documento de orden de compra existente."""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data},
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0