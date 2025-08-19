# backend/app/modules/purchasing/repositories/goods_receipt_repository.py

"""
Capa de Repositorio para la entidad 'Recepción de Mercancía' (Goods Receipt).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección 'goods_receipts' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para soportar opcionalmente sesiones transaccionales de MongoDB,
garantizando la consistencia de los datos en operaciones críticas como la entrada de stock.
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

class GoodsReceiptRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de recepciones de mercancía.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.goods_receipts

    async def insert_one(self, receipt_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """
        Inserta un nuevo documento de recepción de mercancía en la colección.

        Args:
            receipt_doc: Un diccionario que representa la recepción a crear.
            session: Una sesión de cliente de Motor opcional para operaciones transaccionales.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(receipt_doc, session=session)
        return result.inserted_id

    async def find_by_id(self, receipt_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Busca una única recepción de mercancía por su ObjectId de MongoDB.

        Args:
            receipt_id: El ID (en formato string) de la recepción a buscar.
            session: Una sesión de cliente de Motor opcional.

        Returns:
            Un diccionario representando el documento si se encuentra, de lo contrario None.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(receipt_id)}, session=session)
        except InvalidId:
            return None

    async def find_one_sorted(self, sort_options: List, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.

        Args:
            sort_options: Una lista de tuplas para el ordenamiento (ej. [("created_at", -1)]).
            session: Una sesión de cliente de Motor opcional.

        Returns:
            Un diccionario representando el documento si se encuentra, de lo contrario None.
        """
        return await self.collection.find_one(sort=sort_options, session=session)

    async def find_all_by_purchase_order_id(self, purchase_order_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """
        Encuentra todas las recepciones asociadas a una orden de compra específica.

        Args:
            purchase_order_id: El ID de la orden de compra.
            session: Una sesión de cliente de Motor opcional.

        Returns:
            Una lista de diccionarios, cada uno representando una recepción.
        """
        try:
            object_id = ObjectId(purchase_order_id)
            cursor = self.collection.find({"purchase_order_id": object_id}, session=session)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []

    async def find_all_paginated(self, query: Dict[str, Any], skip: int, page_size: int, sort_options: Optional[List] = None) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples recepciones con paginación y ordenamiento.

        Args:
            query: El diccionario de consulta de MongoDB para filtrar los resultados.
            skip: El número de documentos a omitir (para la paginación).
            page_size: El número máximo de documentos a devolver.
            sort_options: Una lista opcional para el ordenamiento.

        Returns:
            Una lista de diccionarios, cada uno representando una recepción.
        """
        cursor = self.collection.find(query)
        if sort_options:
            cursor = cursor.sort(sort_options)
        cursor = cursor.skip(skip).limit(page_size)
        return await cursor.to_list(length=page_size)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        """
        Cuenta el número total de documentos que coinciden con una consulta.

        Args:
            query: El diccionario de consulta de MongoDB.

        Returns:
            El número total de documentos coincidentes.
        """
        return await self.collection.count_documents(query)