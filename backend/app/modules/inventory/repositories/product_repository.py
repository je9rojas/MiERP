# /backend/app/modules/inventory/repositories/product_repository.py

"""
Capa de Acceso a Datos (Repositorio) para la entidad 'Producto'.

Este archivo define la clase `ProductRepository`, que encapsula toda la interacción
directa con la colección 'products' en la base de datos MongoDB. Su única
responsabilidad es ejecutar operaciones CRUD (Crear, Leer, Actualizar, Borrar)
y devolver los datos brutos (diccionarios de Python), manteniendo el resto
de la aplicación agnóstica a la implementación específica de la base de datos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import List, Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DEL REPOSITORIO
# ==============================================================================

class ProductRepository:
    """
    Gestiona las operaciones de base de datos para la colección de productos.
    """
    
    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.
        """
        self.collection = database.products

    async def insert_one(self, product_document: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """Inserta un único documento de producto en la colección."""
        result = await self.collection.insert_one(product_document, session=session)
        return result.inserted_id

    async def find_by_id(self, product_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra un producto por su ObjectId de base de datos."""
        try:
            object_id = ObjectId(product_id)
            return await self.collection.find_one({"_id": object_id}, session=session)
        except InvalidId:
            return None

    async def find_by_ids(self, product_ids: List[str], session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Encuentra eficientemente todos los productos que coinciden con una lista de IDs."""
        valid_object_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]
        if not valid_object_ids:
            return []
        query = {"_id": {"$in": valid_object_ids}}
        cursor = self.collection.find(query, session=session)
        return await cursor.to_list(length=None)

    async def find_by_sku(self, sku: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra un producto por su SKU, que debe ser único."""
        return await self.collection.find_one({"sku": sku}, session=session)

    async def find_paginated(self, query_filter: Dict[str, Any], skip: int, limit: int, session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Encuentra documentos de forma paginada que coinciden con una consulta."""
        cursor = self.collection.find(query_filter, session=session).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def update_one_by_id(self, product_id: str, fields_to_update: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """
        Actualiza campos específicos de un documento usando el operador $set.
        Este método es ideal para actualizaciones parciales simples.
        """
        try:
            object_id = ObjectId(product_id)
            result = await self.collection.update_one(
                {"_id": object_id},
                {"$set": fields_to_update},
                session=session
            )
            return result.modified_count
        except InvalidId:
            return 0

    async def execute_update_one_by_id(self, product_id: str, update_operation: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """
        Ejecuta una operación de actualización completa en un documento.
        Este método es flexible y permite el uso de cualquier operador de MongoDB (ej: $set, $inc).
        """
        try:
            object_id = ObjectId(product_id)
            result = await self.collection.update_one(
                {"_id": object_id},
                update_operation,
                session=session
            )
            return result.modified_count
        except InvalidId:
            return 0

    async def count_documents(self, query_filter: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Cuenta el número de documentos que coinciden con una consulta."""
        return await self.collection.count_documents(query_filter, session=session)