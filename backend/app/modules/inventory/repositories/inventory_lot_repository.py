# /backend/app/modules/inventory/repositories/inventory_lot_repository.py

"""
Capa de Repositorio para la entidad 'Lote de Inventario' (InventoryLot).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'inventory_lots' en la base de datos MongoDB. Abstrae las
operaciones de la base de datos y está diseñado para operar dentro de
transacciones de MongoDB para garantizar la consistencia de los datos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import List, Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class InventoryLotRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de lotes de inventario.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.inventory_lots

    async def insert_one(
        self,
        lot_doc: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> ObjectId:
        """
        Inserta un nuevo documento de lote en la colección.

        Args:
            lot_doc: Un diccionario que representa el lote a crear.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(lot_doc, session=session)
        return result.inserted_id

    async def find_by_id(
        self,
        lot_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca un único lote por su ObjectId de MongoDB.

        Args:
            lot_id: El ID (en formato string) del lote a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Un diccionario representando el documento si se encuentra, de lo contrario None.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(lot_id)}, session=session)
        except InvalidId:
            return None

    async def find_by_product_id(
        self,
        product_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra todos los lotes asociados a un ID de producto específico.

        Args:
            product_id: El ID del producto a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Una lista de diccionarios, cada uno representando un lote de inventario.
        """
        try:
            cursor = self.collection.find({"product_id": ObjectId(product_id)}, session=session)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []

    async def find_available_by_product_id(
        self,
        product_id: str,
        sort_options: Optional[List] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra todos los lotes con stock disponible (> 0) para un producto.

        Args:
            product_id: El ID del producto a buscar.
            sort_options: Opciones de ordenamiento para la consulta (ej. para PEPS/FIFO).
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Una lista de lotes de inventario con stock disponible.
        """
        try:
            query = {"product_id": ObjectId(product_id), "current_quantity": {"$gt": 0}}
            cursor = self.collection.find(query, session=session)
            if sort_options:
                cursor = cursor.sort(sort_options)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []
            
    async def update_one_by_id(
        self,
        lot_id: str,
        update_data: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Actualiza un documento de lote existente, buscándolo por su ID.

        Args:
            lot_id: El ID del lote a actualizar.
            update_data: Un diccionario con los campos y valores a actualizar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El número de documentos modificados (0 o 1).
        """
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(lot_id)},
                {"$set": update_data},
                session=session
            )
            return result.modified_count
        except InvalidId:
            return 0

    async def aggregate(
        self,
        pipeline: List[Dict[str, Any]],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Ejecuta un pipeline de agregación en la colección de lotes.

        Args:
            pipeline: La lista de etapas de la agregación de MongoDB.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El resultado de la agregación como una lista de diccionarios.
        """
        cursor = self.collection.aggregate(pipeline, session=session)
        return await cursor.to_list(length=None)