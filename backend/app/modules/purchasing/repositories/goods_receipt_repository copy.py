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
        """
        self.collection = db.goods_receipts

    async def insert_one(self, receipt_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """
        Inserta un nuevo documento de recepción de mercancía en la colección.
        """
        result = await self.collection.insert_one(receipt_doc, session=session)
        return result.inserted_id

    async def find_by_id(self, receipt_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Busca una única recepción de mercancía por su ObjectId de MongoDB.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(receipt_id)}, session=session)
        except InvalidId:
            return None

    async def find_one_sorted(self, sort_options: List, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.
        Útil para generar números de documento secuenciales.
        """
        return await self.collection.find_one(sort=sort_options, session=session)

    async def find_all_by_purchase_order_id(self, purchase_order_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """
        Encuentra todas las recepciones de mercancía asociadas a una orden de compra específica.
        """
        try:
            object_id = ObjectId(purchase_order_id)
            cursor = self.collection.find({"purchase_order_id": object_id}, session=session)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []