# /backend/app/modules/sales/repositories/shipment_repository.py

"""
Capa de Repositorio para la entidad 'Despacho' (Shipment).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección 'shipments' en la base de datos MongoDB. Hereda la funcionalidad
CRUD común de BaseRepository y añade métodos de consulta específicos para despachos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import List, Optional, Dict, Any

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession

# Se importa la clase base para heredar su funcionalidad.
from app.repositories.base_repository import BaseRepository
from app.models.shared import PyObjectId
# Se importa el modelo Pydantic que representa el despacho en la base de datos.
from ..sales_models import ShipmentInDB

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class ShipmentRepository(BaseRepository[ShipmentInDB]):
    """
    Gestiona todas las operaciones de base de datos para la colección de despachos.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de despachos.

        Args:
            database: La instancia de la base de datos asíncrona (Motor).
        """
        # Se llama al constructor de la clase base, proporcionando el nombre de
        # la colección y el modelo Pydantic con el que trabajará.
        super().__init__(
            database=database,
            collection_name="shipments",
            model=ShipmentInDB
        )

    async def find_all_by_sales_order_id(
        self,
        sales_order_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra todos los despachos asociados a una orden de venta específica.

        Args:
            sales_order_id: El ID de la orden de venta a la que pertenecen los despachos.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Una lista de documentos de despachos encontrados.
        """
        query = {"sales_order_id": PyObjectId(sales_order_id)}
        cursor = self.collection.find(query, session=session)
        # Se utiliza length=None para asegurar que se devuelven todos los documentos coincidentes.
        return await cursor.to_list(length=None)