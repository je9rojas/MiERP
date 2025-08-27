# /backend/app/modules/purchasing/repositories/purchase_bill_repository.py

"""
Capa de Repositorio para la entidad 'Factura de Compra' (Purchase Bill).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de facturas de compra ('purchase_bills') en la base de datos MongoDB.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase

from app.repositories.base_repository import BaseRepository
from app.modules.purchasing.purchase_bill_models import PurchaseBillInDB

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DEL REPOSITORIO
# ==============================================================================

class PurchaseBillRepository(BaseRepository[PurchaseBillInDB]):
    """
    Gestiona las operaciones de base de datos para la colección 'purchase_bills'.

    Hereda la funcionalidad CRUD de BaseRepository y puede ser extendida con
    métodos de consulta específicos para las facturas de compra si es necesario.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de facturas de compra.

        Args:
            database: Una instancia de AsyncIOMotorDatabase para la conexión.
        """
        super().__init__(
            database,
            collection_name="purchase_bills",
            model=PurchaseBillInDB
        )

    async def find_all_by_purchase_order_id(
        self,
        purchase_order_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra todas las facturas de compra asociadas a una orden de compra.

        Args:
            purchase_order_id: El ID (en formato string) de la orden de compra.
            session: Una sesión de cliente de Motor opcional.

        Returns:
            Una lista de diccionarios, cada uno representando una factura.
        """
        try:
            object_id = ObjectId(purchase_order_id)
            cursor = self.collection.find({"purchase_order_id": object_id}, session=session)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []