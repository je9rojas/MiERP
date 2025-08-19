# /backend/app/modules/sales/repositories/sales_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Venta' (Sales Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente
con la colección de 'sales_orders' en MongoDB. Abstrae las operaciones de la
base de datos y está diseñado para operar dentro de transacciones de MongoDB.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class SalesOrderRepository:
    """
    Gestiona las operaciones de base de datos para la colección de órdenes de venta.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.sales_orders

    async def insert_one(
        self,
        order_doc: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> ObjectId:
        """
        Inserta un nuevo documento de orden de venta.

        Args:
            order_doc: Un diccionario que representa la orden a crear.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(order_doc, session=session)
        return result.inserted_id

    async def find_by_id(
        self,
        order_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca una única orden de venta por su ObjectId.

        Args:
            order_id: El ID (en formato string) de la orden a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Un diccionario representando el documento si se encuentra, de lo contrario None.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(order_id)}, session=session)
        except InvalidId:
            return None

    async def find_all_paginated(
        self,
        query: Dict[str, Any],
        skip: int,
        limit: int,
        sort_options: Optional[List] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples órdenes de venta con paginación y ordenamiento.

        Args:
            query: El diccionario de consulta de MongoDB.
            skip: El número de documentos a omitir.
            limit: El número máximo de documentos a devolver.
            sort_options: Opciones de ordenamiento para la consulta.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Una lista de diccionarios, cada uno representando una orden de venta.
        """
        cursor = self.collection.find(query, session=session)
        if sort_options:
            cursor = cursor.sort(sort_options)
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(
        self,
        query: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Cuenta el número total de documentos que coinciden con una consulta.

        Args:
            query: El diccionario de consulta de MongoDB.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El número total de documentos coincidentes.
        """
        return await self.collection.count_documents(query, session=session)

    # Aquí puedes añadir futuros métodos como update_one_by_id.