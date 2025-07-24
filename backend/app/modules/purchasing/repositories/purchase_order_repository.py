# /backend/app/modules/purchasing/repositories/purchase_order_repository.py

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import List, Optional, Dict, Any
from bson import ObjectId

class PurchaseOrderRepository:
    """
    Capa de acceso a datos para la colección de Órdenes de Compra en MongoDB.
    Encapsula todas las operaciones de base de datos para este módulo.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con la instancia de la base de datos.
        
        Args:
            db: Una instancia de AsyncIOMotorDatabase conectada.
        """
        self.collection = db["purchase_orders"]

    async def insert_one(self, document: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """
        Inserta un único documento en la colección de órdenes de compra.
        
        Args:
            document: El diccionario que representa la orden de compra.
            session: Una sesión opcional de MongoDB para transacciones.
        
        Returns:
            El ObjectId del documento insertado.
        """
        result = await self.collection.insert_one(document, session=session)
        return result.inserted_id

    async def find_by_id(self, po_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """

        Busca una orden de compra por su ObjectId.
        
        Args:
            po_id: El ID de la orden de compra como string.
            session: Una sesión opcional de MongoDB para transacciones.

        Returns:
            El documento de la orden de compra si se encuentra, de lo contrario None.
        """
        return await self.collection.find_one({"_id": ObjectId(po_id)}, session=session)

    async def update_one(self, po_id: ObjectId, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None):
        """
        Actualiza una orden de compra existente.

        Args:
            po_id: El ObjectId de la orden a actualizar.
            update_data: Un diccionario con los campos a actualizar.
            session: Una sesión opcional de MongoDB para transacciones.

        Returns:
            El resultado de la operación de actualización de PyMongo.
        """
        return await self.collection.update_one(
            {"_id": po_id},
            {"$set": update_data},
            session=session
        )

    async def find_all_paginated(self, query: Dict[str, Any], skip: int, limit: int) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples órdenes de compra con paginación y ordenamiento.
        
        Args:
            query: El filtro de MongoDB para la búsqueda.
            skip: El número de documentos a omitir.
            limit: El número máximo de documentos a devolver.

        Returns:
            Una lista de documentos de órdenes de compra.
        """
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        """
        Cuenta el número de documentos que coinciden con una consulta.
        
        Args:
            query: El filtro de MongoDB.
            
        Returns:
            El número total de documentos coincidentes.
        """
        return await self.collection.count_documents(query)