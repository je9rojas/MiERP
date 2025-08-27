# /backend/app/modules/purchasing/repositories/goods_receipt_repository.py

"""
Capa de Repositorio para la entidad 'Recepción de Mercancía' (Goods Receipt).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección 'goods_receipts' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para soportar opcionalmente sesiones transaccionales de MongoDB.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase

from app.repositories.base_repository import BaseRepository
from app.modules.purchasing.goods_receipt_models import GoodsReceiptInDB

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DEL REPOSITORIO
# ==============================================================================

class GoodsReceiptRepository(BaseRepository[GoodsReceiptInDB]):
    """
    Gestiona las operaciones de base de datos para la colección 'goods_receipts'.

    Hereda la funcionalidad CRUD de BaseRepository y añade métodos de consulta
    específicos para las recepciones de mercancía.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de recepciones de mercancía.

        Args:
            database: Una instancia de AsyncIOMotorDatabase para la conexión.
        """
        super().__init__(
            database,
            collection_name="goods_receipts",
            model=GoodsReceiptInDB
        )

    async def find_all_by_purchase_order_id(
        self,
        purchase_order_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra todas las recepciones asociadas a una orden de compra específica.

        Este es un método personalizado que no forma parte del BaseRepository
        porque implica una consulta específica por un campo que no es el '_id'.

        Args:
            purchase_order_id: El ID (en formato string) de la orden de compra.
            session: Una sesión de cliente de Motor opcional.

        Returns:
            Una lista de diccionarios, cada uno representando una recepción.
        """
        try:
            object_id = ObjectId(purchase_order_id)
            cursor = self.collection.find({"purchase_order_id": object_id}, session=session)
            # El length=None asegura que se obtengan todos los documentos que coincidan.
            return await cursor.to_list(length=None)
        except InvalidId:
            # Si el ID proporcionado no es un ObjectId válido, retorna una lista vacía.
            return []