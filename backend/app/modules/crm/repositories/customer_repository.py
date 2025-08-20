# /backend/app/modules/crm/repositories/customer_repository.py

"""
Capa de Repositorio para la entidad 'Cliente' (Customer).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'customers' en la base de datos MongoDB. Hereda la funcionalidad
CRUD común de BaseRepository y añade métodos de consulta específicos para clientes.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Optional, Dict, Any

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession

# Se importa la clase base para heredar su funcionalidad.
from app.repositories.base_repository import BaseRepository
# Se importa el modelo Pydantic que representa al cliente en la base de datos.
from ..customer_models import CustomerInDB

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class CustomerRepository(BaseRepository[CustomerInDB]):
    """
    Gestiona las operaciones de base de datos para la colección de clientes.

    Hereda de `BaseRepository` para obtener métodos CRUD estandarizados como
    `find_one_by_id`, `insert_one`, `find_all_paginated`, etc.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de clientes.

        Args:
            database: La instancia de la base de datos asíncrona (Motor).
        """
        # Se llama al constructor de la clase base, proporcionando el nombre de
        # la colección y el modelo Pydantic con el que trabajará.
        super().__init__(
            database=database,
            collection_name="customers",
            model=CustomerInDB
        )

    async def find_by_doc_number(
        self,
        doc_number: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca un único cliente por su número de documento (campo específico).

        Args:
            doc_number: El número de documento del cliente a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Un diccionario representando el documento del cliente si se encuentra,
            de lo contrario None.
        """
        # Utiliza el método genérico 'find_one_by' heredado de la clase base.
        return await self.find_one_by({"doc_number": doc_number}, session=session)