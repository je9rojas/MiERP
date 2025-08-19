# /backend/app/modules/sales/repositories/sales_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Venta' (Sales Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente
con la colección de 'sales_orders' en MongoDB. Abstrae las operaciones de la
base de datos y está diseñado para operar dentro de transacciones de MongoDB.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import Dict, Any, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
import json # Se importa para una impresión bonita de los logs

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class SalesOrderRepository:
    """
    Gestiona las operaciones de base de datos para la colección de órdenes de venta.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.
        """
        self.collection = db.sales_orders

    async def insert_one(
        self,
        order_doc: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> ObjectId:
        """
        Inserta un nuevo documento de orden de venta.
        """
        result = await self.collection.insert_one(order_doc, session=session)
        return result.inserted_id

    async def find_by_id(
        self,
        order_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca una única orden de venta por su ObjectId.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(order_id)}, session=session)
        except InvalidId:
            return None

    async def find_all_paginated(
        self,
        query: Dict[str, Any],
        skip: int,
        limit: int,
        sort_options: Optional[List] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples órdenes de venta con paginación y ordenamiento.
        """
        cursor = self.collection.find(query, session=session)
        if sort_options:
            cursor = cursor.sort(sort_options)
        cursor = cursor.skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        
        # --- LOG DE DEPURACIÓN ---
        # Imprime los documentos crudos recuperados de la base de datos.
        # Usamos json.dumps con default=str para manejar ObjectIds y datetimes.
        print("\n[DEBUG] sales_repository.find_all_paginated - Documentos crudos de MongoDB:")
        print(json.dumps(documents, indent=2, default=str))
        print("-" * 50)
        # --- FIN DEL LOG DE DEPURACIÓN ---
        
        return documents

    async def count_documents(
        self,
        query: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Cuenta el número total de documentos que coinciden con una consulta.
        """
        return await self.collection.count_documents(query, session=session)

    # Nota: El método `find_one_sorted` no estaba en tu archivo, lo añado por consistencia.
    async def find_one_sorted(
        self, 
        sort_options: List, 
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Encuentra el primer documento de la colección según un criterio de ordenamiento.
        """
        return await self.collection.find_one(sort=sort_options, session=session)
        
    # Aquí puedes añadir futuros métodos como update_one_by_id.
    async def update_one_by_id(
        self, 
        order_id: str, 
        update_data: Dict[str, Any], 
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Actualiza un documento de orden de venta existente.
        """
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data},
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0