# /backend/app/modules/purchasing/repositories/invoice_repository.py

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import Optional, Dict, Any
from bson import ObjectId

class InvoiceRepository:
    """
    Capa de acceso a datos para la colección de Facturas de Compra en MongoDB.
    Encapsula todas las operaciones de base de datos para las facturas de este módulo.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con la instancia de la base de datos.
        
        Args:
            db: Una instancia de AsyncIOMotorDatabase conectada.
        """
        # Es una buena práctica ser específico con el nombre de la colección.
        self.collection = db["purchase_invoices"]

    async def insert_one(self, document: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """
        Inserta un único documento en la colección de facturas de compra.
        
        Args:
            document: El diccionario que representa la factura de compra.
            session: Una sesión opcional de MongoDB para transacciones.
        
        Returns:
            El ObjectId del documento insertado.
        """
        result = await self.collection.insert_one(document, session=session)
        return result.inserted_id

    async def find_by_id(self, invoice_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Busca una factura de compra por su ObjectId.
        
        Args:
            invoice_id: El ID de la factura como string.
            session: Una sesión opcional de MongoDB para transacciones.

        Returns:
            El documento de la factura si se encuentra, de lo contrario None.
        """
        return await self.collection.find_one({"_id": ObjectId(invoice_id)}, session=session)

    # Aunque no se use inmediatamente, es bueno tener el método de actualización.
    async def update_one(self, invoice_id: ObjectId, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None):
        """
        Actualiza una factura de compra existente.

        Args:
            invoice_id: El ObjectId de la factura a actualizar.
            update_data: Un diccionario con los campos a actualizar.
            session: Una sesión opcional de MongoDB para transacciones.

        Returns:
            El resultado de la operación de actualización de PyMongo.
        """
        return await self.collection.update_one(
            {"_id": invoice_id},
            {"$set": update_data},
            session=session
        )