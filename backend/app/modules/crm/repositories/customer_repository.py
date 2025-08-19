# /backend/app/modules/crm/repositories/customer_repository.py

"""
Capa de Repositorio para la entidad 'Cliente' (Customer).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'customers' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para operar dentro de transacciones.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import List, Optional, Dict, Any, Tuple
from bson import ObjectId
from bson.errors import InvalidId

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class CustomerRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de clientes.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.customers

    async def insert_one(
        self,
        customer_doc: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> ObjectId:
        """
        Inserta un nuevo documento de cliente en la colección.

        Args:
            customer_doc: Un diccionario que representa el cliente a crear.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(customer_doc, session=session)
        return result.inserted_id

    async def find_by_id(
        self,
        customer_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca un único cliente por su ObjectId de MongoDB.

        Args:
            customer_id: El ID (en formato string) del cliente a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Un diccionario representando el documento del cliente si se encuentra, de lo contrario None.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(customer_id)}, session=session)
        except InvalidId:
            return None
            
    async def find_by_ids(
        self,
        customer_ids: List[str],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca eficientemente todos los clientes que coinciden con una lista de IDs.

        Args:
            customer_ids: Una lista de strings, cada uno representando un ObjectId.
            session: Una sesión opcional para operaciones transaccionales.

        Returns:
            Una lista de documentos de clientes encontrados.
        """
        valid_object_ids = [ObjectId(cid) for cid in customer_ids if ObjectId.is_valid(cid)]
        if not valid_object_ids:
            return []

        query = {"_id": {"$in": valid_object_ids}}
        cursor = self.collection.find(query, session=session)
        return await cursor.to_list(length=None)

    async def find_by_doc_number(
        self,
        doc_number: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca un único cliente por su número de documento.

        Args:
            doc_number: El número de documento del cliente a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Un diccionario representando el documento del cliente si se encuentra, de lo contrario None.
        """
        return await self.collection.find_one({"doc_number": doc_number}, session=session)

    async def find_all_paginated(
        self,
        query: Dict[str, Any],
        skip: int,
        limit: int,
        sort_options: Optional[List[Tuple[str, int]]] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples documentos de clientes con paginación y ordenamiento.

        Args:
            query: El filtro de la consulta de MongoDB.
            skip: El número de documentos a omitir.
            limit: El número máximo de documentos a devolver.
            sort_options: Opciones de ordenamiento.
            session: Una sesión opcional para transacciones.

        Returns:
            Una lista de documentos de clientes.
        """
        cursor = self.collection.find(query, session=session)
        if sort_options:
            cursor = cursor.sort(sort_options)
        
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def update_one_by_id(
        self,
        customer_id: str,
        update_data: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Actualiza un documento de cliente existente.

        Args:
            customer_id: El ID del cliente a actualizar.
            update_data: El payload con los operadores de actualización de MongoDB (ej. {"$set": ...}).
            session: Una sesión opcional para transacciones.

        Returns:
            El número de documentos que coincidieron con el filtro (0 o 1).
        """
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(customer_id)},
                update_data,
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0
            
    async def count_documents(
        self,
        query: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Cuenta el número total de documentos que coinciden con una consulta.

        Args:
            query: El filtro de la consulta de MongoDB.
            session: Una sesión opcional para transacciones.

        Returns:
            El número total de documentos.
        """
        return await self.collection.count_documents(query, session=session)