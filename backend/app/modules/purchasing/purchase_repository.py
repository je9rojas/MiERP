# /backend/app/modules/purchasing/repositories/purchase_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Compra' (Purchase Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'purchase_orders' en la base de datos MongoDB. Abstrae las operaciones
CRUD para que la capa de servicio pueda utilizarlas sin conocer los detalles de
la implementación de la base de datos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
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
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.purchase_orders

    async def find_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca una única orden de compra por su ObjectId de MongoDB.

        Args:
            order_id: El ID (en formato string) de la orden a buscar.

        Returns:
            Un diccionario representando el documento si se encuentra, de lo contrario None.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(order_id)})
        except InvalidId:
            return None

    async def insert_one(self, order_doc: Dict[str, Any]) -> ObjectId:
        """
        Inserta un nuevo documento de orden de compra en la colección.

        Args:
            order_doc: Un diccionario que representa la orden a crear.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(order_doc)
        return result.inserted_id

    async def find_all_paginated(self, query: Dict[str, Any], skip: int, limit: int, sort_options: Optional[List] = None) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples documentos de órdenes de compra con paginación y ordenamiento.

        Args:
            query: El diccionario de consulta de MongoDB para filtrar los resultados.
            skip: El número de documentos a omitir.
            limit: El número máximo de documentos a devolver.
            sort_options: Opciones de ordenamiento para la consulta.

        Returns:
            Una lista de diccionarios, cada uno representando una orden de compra.
        """
        cursor = self.collection.find(query)
        if sort_options:
            cursor = cursor.sort(sort_options)
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        """
        Cuenta el número total de documentos que coinciden con una consulta.

        Args:
            query: El diccionario de consulta de MongoDB.

        Returns:
            El número total de documentos coincidentes.
        """
        return await self.collection.count_documents(query)

    async def update_one_by_id(self, order_id: str, update_data: Dict[str, Any]) -> int:
        """
        Actualiza un documento de orden de compra existente, buscándolo por su ID.

        Args:
            order_id: El ID de la orden a actualizar.
            update_data: Un diccionario con los campos y valores a actualizar.

        Returns:
            El número de documentos que coincidieron con el filtro (0 o 1).
        """
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data}
            )
            return result.matched_count
        except InvalidId:
            return 0