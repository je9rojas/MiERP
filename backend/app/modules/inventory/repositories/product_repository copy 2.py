# backend/app/modules/inventory/repositories/product_repository.py

"""
Capa de Acceso a Datos (Repositorio) para la entidad 'Producto'.

Este archivo define la clase `ProductRepository`, que encapsula toda la interacción
directa con la colección 'products' en la base de datos MongoDB. Su única
responsabilidad es ejecutar operaciones CRUD (Crear, Leer, Actualizar, Borrar)
y devolver los datos brutos (diccionarios de Python), manteniendo el resto
de la aplicación agnóstica a la implementación específica de la base de datos.
Todos los métodos están diseñados para soportar opcionalmente sesiones transaccionales.
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
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.
        """
        self.collection = db.products

    async def insert_one(self, product_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """Inserta un único documento de producto en la colección."""
        result = await self.collection.insert_one(product_doc, session=session)
        return result.inserted_id

    async def find_by_id(self, product_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra un producto por su ObjectId de base de datos."""
        try:
            return await self.collection.find_one({"_id": ObjectId(product_id)}, session=session)
        except InvalidId:
            return None

    async def find_by_ids(self, product_ids: List[str], session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """
        Encuentra eficientemente todos los productos que coinciden con una lista de IDs.

        Args:
            product_ids: Una lista de strings, cada uno representando un ObjectId.
            session: Una sesión opcional de Motor para operaciones transaccionales.

        Returns:
            Una lista de documentos de productos encontrados.
        """
        valid_object_ids = []
        for pid in product_ids:
            try:
                valid_object_ids.append(ObjectId(pid))
            except InvalidId:
                # Ignora los IDs que no son válidos para evitar un fallo en la consulta.
                continue
        
        if not valid_object_ids:
            return []

        query = {"_id": {"$in": valid_object_ids}}
        cursor = self.collection.find(query, session=session)
        return await cursor.to_list(length=None)

    async def find_by_sku(self, sku: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra un producto por su SKU, que debe ser único."""
        return await self.collection.find_one({"sku": sku}, session=session)

    async def find_by_skus(self, skus: List[str], session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Encuentra eficientemente todos los productos que coinciden con una lista de SKUs."""
        query = {"sku": {"$in": skus}}
        cursor = self.collection.find(query, session=session)
        return await cursor.to_list(length=None)

    async def find_all(self, query: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Encuentra todos los documentos que coinciden con una consulta, sin paginación."""
        cursor = self.collection.find(query, session=session)
        return await cursor.to_list(length=None)

    async def find_paginated(self, query: Dict[str, Any], skip: int, page_size: int, session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Encuentra documentos de forma paginada que coinciden con una consulta."""
        cursor = self.collection.find(query, session=session).skip(skip).limit(page_size)
        return await cursor.to_list(length=page_size)

    async def update_one_by_id(self, product_id: str, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Actualiza un documento basado en su ID."""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": update_data},
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0

    async def update_and_find_by_sku(self, sku: str, update_payload: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Actualiza un producto por su SKU y devuelve el documento actualizado."""
        updated_document = await self.collection.find_one_and_update(
            {"sku": sku},
            update_payload,
            return_document=ReturnDocument.AFTER,
            session=session
        )
        return updated_document

    async def deactivate_one(self, sku: str, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Realiza un borrado lógico actualizando el campo 'is_active'."""
        result = await self.collection.update_one({"sku": sku}, {"$set": update_data}, session=session)
        return result.modified_count

    async def count_documents(self, query: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Cuenta el número de documentos que coinciden con una consulta."""
        return await self.collection.count_documents(query, session=session)