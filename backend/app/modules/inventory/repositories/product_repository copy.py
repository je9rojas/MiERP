# backend/app/modules/inventory/repositories/product_repository.py

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

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from bson import ObjectId
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

        Args:
            db: Una instancia de AsyncIOMotorDatabase conectada.
        """
        self.collection = db.products

    async def insert_one(self, product_doc: Dict[str, Any]) -> ObjectId:
        """Inserta un único documento de producto en la colección."""
        result = await self.collection.insert_one(product_doc)
        return result.inserted_id

    async def find_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Encuentra un producto por su ObjectId de base de datos."""
        return await self.collection.find_one({"_id": ObjectId(product_id)})

    async def find_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        """Encuentra un producto por su SKU, que debe ser único."""
        return await self.collection.find_one({"sku": sku})

    async def find_all(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Encuentra todos los documentos que coinciden con una consulta, sin paginación.

        Este método es útil para operaciones que requieren el conjunto de datos completo,
        como la generación de reportes.

        Args:
            query: El diccionario de filtro de MongoDB.

        Returns:
            Una lista de todos los documentos que coinciden con la consulta.
        """
        # CORRECCIÓN: Se reintroduce el método `find_all`.
        cursor = self.collection.find(query)
        # El argumento length=None asegura que se recuperen todos los documentos del cursor.
        return await cursor.to_list(length=None)

    async def find_paginated(self, query: Dict[str, Any], skip: int, page_size: int) -> List[Dict[str, Any]]:
        """Encuentra documentos de forma paginada que coinciden con una consulta."""
        cursor = self.collection.find(query).skip(skip).limit(page_size)
        return await cursor.to_list(length=page_size)

    async def update_one_by_id(self, product_id: str, update_data: Dict[str, Any], session=None) -> int:
        """Actualiza un documento basado en su ID."""
        result = await self.collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data},
            session=session
        )
        return result.matched_count

    async def update_and_find_by_sku(self, sku: str, update_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Actualiza un producto por su SKU y devuelve el documento actualizado.
        """
        updated_document = await self.collection.find_one_and_update(
            {"sku": sku},
            update_payload,
            return_document=ReturnDocument.AFTER
        )
        return updated_document

    async def deactivate_one(self, sku: str, update_data: Dict[str, Any]) -> int:
        """Realiza un borrado lógico actualizando el campo 'is_active'."""
        result = await self.collection.update_one({"sku": sku}, {"$set": update_data})
        return result.modified_count

    async def count_documents(self, query: Dict[str, Any]) -> int:
        """Cuenta el número de documentos que coinciden con una consulta."""
        return await self.collection.count_documents(query)