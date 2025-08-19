"""
Capa de Repositorio para la entidad 'Orden de Venta' (Sales Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente
con la colección de 'sales_orders' en MongoDB. Abstrae las operaciones de la
base de datos (CRUD) y está diseñado para ser utilizado por la capa de servicio.
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

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            database: Una instancia de AsyncIOMotorDatabase para interactuar con MongoDB.
        """
        self.collection = database.sales_orders

    async def insert_one(
        self,
        order_document: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> ObjectId:
        """
        Inserta un nuevo documento de orden de venta en la colección.

        Args:
            order_document: El diccionario que representa la orden de venta a insertar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(order_document, session=session)
        return result.inserted_id

    async def find_by_id(
        self,
        order_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca una única orden de venta por su ID de documento (_id).

        Args:
            order_id: El ID de la orden de venta en formato de cadena.
            session: Una sesión de cliente de MongoDB opcional.

        Returns:
            Un diccionario con los datos de la orden si se encuentra, de lo contrario None.
        """
        try:
            object_id = ObjectId(order_id)
            return await self.collection.find_one({"_id": object_id}, session=session)
        except InvalidId:
            return None

    async def find_all_paginated(
        self,
        query_filter: Dict[str, Any],
        skip: int,
        limit: int,
        sort_options: Optional[List] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples órdenes de venta con paginación y ordenamiento.

        Args:
            query_filter: El filtro de consulta de MongoDB.
            skip: El número de documentos a omitir (para paginación).
            limit: El número máximo de documentos a devolver.
            sort_options: Opciones de ordenamiento para la consulta.
            session: Una sesión de cliente de MongoDB opcional.

        Returns:
            Una lista de diccionarios, cada uno representando una orden de venta.
        """
        cursor = self.collection.find(query_filter, session=session)
        if sort_options:
            cursor = cursor.sort(sort_options)
        
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(
        self,
        query_filter: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Cuenta el número total de documentos que coinciden con un filtro de consulta.

        Args:
            query_filter: El filtro de consulta de MongoDB.
            session: Una sesión de cliente de MongoDB opcional.

        Returns:
            El número total de documentos que coinciden.
        """
        return await self.collection.count_documents(query_filter, session=session)

    async def find_one_sorted(
        self, 
        sort_options: List, 
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.
        
        Args:
            sort_options: Una lista de tuplas para el ordenamiento, ej: [("field", 1)].
            session: Una sesión de cliente de MongoDB opcional.

        Returns:
            El documento encontrado o None.
        """
        return await self.collection.find_one(sort=sort_options, session=session)
        
    async def update_one_by_id(
        self, 
        order_id: str, 
        fields_to_update: Dict[str, Any], 
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Actualiza campos específicos de un documento usando el operador $set.
        Este método es ideal para actualizaciones parciales simples.

        Args:
            order_id: El ID del documento a actualizar.
            fields_to_update: Un diccionario con los campos y nuevos valores a establecer.
            session: Una sesión de cliente de MongoDB opcional.

        Returns:
            El número de documentos que coincidieron con el filtro (0 o 1).
        """
        try:
            object_id = ObjectId(order_id)
            result = await self.collection.update_one(
                {"_id": object_id},
                {"$set": fields_to_update},
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0
    
    async def execute_update_one_by_id(
        self,
        order_id: str,
        update_operation: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Ejecuta una operación de actualización completa en un documento.
        Este método es flexible y permite el uso de cualquier operador de MongoDB
        (ej: $set, $push, $inc), ya que no añade el $set automáticamente.

        Args:
            order_id: El ID del documento a actualizar.
            update_operation: El documento completo de la operación de actualización de MongoDB.
            session: Una sesión de cliente de MongoDB opcional.

        Returns:
            El número de documentos que coincidieron con el filtro (0 o 1).
        """
        try:
            object_id = ObjectId(order_id)
            result = await self.collection.update_one(
                {"_id": object_id},
                update_operation,  # Se pasa la operación directamente
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0