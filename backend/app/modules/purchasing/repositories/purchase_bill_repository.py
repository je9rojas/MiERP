# backend/app/modules/purchasing/repositories/purchase_bill_repository.py

"""
Capa de Repositorio para la entidad 'Recepción/Factura de Compra' (Purchase Bill).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección 'purchase_bills' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para soportar opcionalmente sesiones transaccionales de MongoDB.
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

class PurchaseBillRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de facturas de compra.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.
        """
        self.collection = db.purchase_bills

    async def insert_one(self, bill_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """
        Inserta un nuevo documento de factura de compra en la colección.
        """
        result = await self.collection.insert_one(bill_doc, session=session)
        return result.inserted_id

    async def find_by_id(self, bill_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Busca una única factura de compra por su ObjectId de MongoDB.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(bill_id)}, session=session)
        except InvalidId:
            return None

    async def find_one_sorted(self, sort_options: List, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.
        """
        return await self.collection.find_one(sort=sort_options, session=session)

    async def find_all_by_purchase_order_id(self, purchase_order_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """
        Encuentra todas las facturas de compra asociadas a una orden de compra específica.
        """
        try:
            object_id = ObjectId(purchase_order_id)
            cursor = self.collection.find({"purchase_order_id": object_id}, session=session)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []