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
from typing import List, Optional, Dict, Any
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

    # Aquí puedes añadir futuros métodos como find_all_paginated, update_one_by_id, etc.