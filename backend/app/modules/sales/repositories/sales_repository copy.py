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
from typing import Dict, Any, Optional
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

    # Aquí puedes añadir futuros métodos como find_all_paginated, update_one_by_id, etc.