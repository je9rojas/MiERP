# backend/app/modules/purchasing/repositories/purchase_order_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Compra' (Purchase Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'purchase_orders' en la base de datos MongoDB. Abstrae las operaciones
CRUD y está diseñado para soportar opcionalmente sesiones transaccionales de MongoDB.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import List, Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
import logging # Importamos logging para un mejor manejo de mensajes

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN
# ==============================================================================
logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: CLASE DEL REPOSITORIO
# ==============================================================================

class PurchaseOrderRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de órdenes de compra.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """Inicializa el repositorio con una instancia de la base de datos."""
        self.collection = db.purchase_orders

    async def insert_one(self, order_doc: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> ObjectId:
        """Inserta un nuevo documento de orden de compra."""
        result = await self.collection.insert_one(order_doc, session=session)
        
        # --- LOG DE DEPURACIÓN ---
        print(f"[DEBUG][REPO] Documento insertado en 'purchase_orders'. ID asignado por DB: {result.inserted_id} (Tipo: {type(result.inserted_id)})")
        # --- FIN LOG ---

        return result.inserted_id

    async def find_by_id(self, order_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Busca una única orden de compra por su ObjectId de MongoDB."""
        
        # --- LOGS DE DEPURACIÓN ---
        print(f"\n[DEBUG][REPO] Iniciando find_by_id para la colección 'purchase_orders'.")
        print(f"[DEBUG][REPO] ID de entrada (string): '{order_id}' (Tipo: {type(order_id)})")
        # --- FIN LOGS ---

        try:
            object_id_to_find = ObjectId(order_id)
            
            # --- LOG DE DEPURACIÓN ---
            print(f"[DEBUG][REPO] String convertido a ObjectId exitosamente: {object_id_to_find} (Tipo: {type(object_id_to_find)})")
            # --- FIN LOG ---

            document_found = await self.collection.find_one({"_id": object_id_to_find}, session=session)
            
            # --- LOG DE DEPURACIÓN ---
            if document_found:
                print(f"[DEBUG][REPO] ¡ÉXITO! Documento encontrado con ID {object_id_to_find}.")
            else:
                print(f"[DEBUG][REPO] ¡FALLO! No se encontró ningún documento con ID {object_id_to_find}.")
            print("-" * 50)
            # --- FIN LOG ---

            return document_found
            
        except InvalidId:
            # --- LOG DE DEPURACIÓN ---
            print(f"[DEBUG][REPO] ¡ERROR! El string de entrada '{order_id}' no es un ObjectId válido.")
            print("-" * 50)
            # --- FIN LOG ---
            return None

    async def find_one_sorted(self, sort_options: List, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra el primer documento según un criterio de ordenamiento."""
        return await self.collection.find_one(sort=sort_options, session=session)

    async def find_all_paginated(
        self,
        query: Dict[str, Any],
        skip: int,
        limit: int,
        sort_options: Optional[List] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """Encuentra múltiples documentos con paginación y ordenamiento."""
        cursor = self.collection.find(query, session=session)
        if sort_options:
            cursor = cursor.sort(sort_options)
        
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(self, query: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Cuenta el número total de documentos que coinciden con una consulta."""
        return await self.collection.count_documents(query, session=session)

    async def update_one_by_id(self, order_id: str, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Actualiza un documento de orden de compra existente."""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(order_id)},
                update_data, # Corregido: update_one puede recibir directamente el payload sin $set
                session=session
            )
            return result.matched_count
        except InvalidId:
            return 0