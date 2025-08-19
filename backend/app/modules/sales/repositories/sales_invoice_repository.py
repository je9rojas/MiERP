# backend/app/modules/sales/repositories/sales_invoice_repository.py

"""
Capa de Repositorio para la entidad 'Factura de Venta' (Sales Invoice).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección 'sales_invoices' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para soportar opcionalmente sesiones transaccionales de MongoDB,
garantizando la consistencia de los datos en operaciones contables.
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

class SalesInvoiceRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de facturas de venta.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.
        """
        self.collection = db.sales_invoices

    async def insert_one(self, invoice_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """
        Inserta un nuevo documento de factura de venta en la colección.
        """
        result = await self.collection.insert_one(invoice_doc, session=session)
        return result.inserted_id

    async def find_by_id(self, invoice_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Busca una única factura de venta por su ObjectId de MongoDB.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(invoice_id)}, session=session)
        except InvalidId:
            return None

    async def find_one_sorted(self, sort_options: List, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.
        """
        return await self.collection.find_one(sort=sort_options, session=session)

    async def find_all_by_sales_order_id(self, sales_order_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """
        Encuentra todas las facturas de venta asociadas a una orden de venta específica.
        """
        try:
            object_id = ObjectId(sales_order_id)
            cursor = self.collection.find({"sales_order_id": object_id}, session=session)
            return await cursor.to_list(length=None)
        except InvalidId:
            return []