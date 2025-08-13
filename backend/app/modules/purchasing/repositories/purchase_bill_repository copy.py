# backend/app/modules/purchasing/repositories/purchase_bill_repository.py

"""
Capa de Repositorio para la entidad 'Recepción/Factura de Compra' (Purchase Bill).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección 'purchase_bills' en la base de datos MongoDB. Abstrae las operaciones
CRUD para que la capa de servicio pueda utilizarlas sin conocer los detalles de
la implementación de la base de datos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
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

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.purchase_bills

    async def insert_one(self, bill_doc: Dict[str, Any]) -> ObjectId:
        """
        Inserta un nuevo documento de factura de compra en la colección.

        Args:
            bill_doc: Un diccionario que representa el documento a insertar.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(bill_doc)
        return result.inserted_id

    async def find_by_id(self, bill_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca una única factura de compra por su ObjectId de MongoDB.

        Args:
            bill_id: El ID del documento en formato string.

        Returns:
            Un diccionario con los datos del documento o None si no se encuentra.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(bill_id)})
        except InvalidId:
            return None

    async def find_one_sorted(self, sort_options: List) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.
        
        Es útil para obtener el documento más reciente y generar números secuenciales.

        Args:
            sort_options: Una lista de tuplas para el ordenamiento (ej. [("campo", -1)]).

        Returns:
            El documento encontrado o None si la colección está vacía.
        """
        return await self.collection.find_one(sort=sort_options)

    async def find_all_by_purchase_order_id(self, purchase_order_id: str) -> List[Dict[str, Any]]:
        """
        Encuentra todas las facturas de compra asociadas a una orden de compra específica.

        Args:
            purchase_order_id: El ID de la orden de compra a la que están vinculadas las facturas.

        Returns:
            Una lista de diccionarios, cada uno representando una factura de compra.
        """
        try:
            object_id = ObjectId(purchase_order_id)
            cursor = self.collection.find({"purchase_order_id": object_id})
            return await cursor.to_list(length=None) # length=None para traer todos los resultados
        except InvalidId:
            return []