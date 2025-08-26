# /backend/app/modules/crm/repositories/supplier_repository.py

"""
Capa de Repositorio para la entidad 'Proveedor' (Supplier).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'suppliers' en la base de datos MongoDB. Abstrae las operaciones
CRUD de la base de datos para que la capa de servicio no necesite conocer los
detalles de la implementación de Motor o PyMongo.
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

class SupplierRepository:
    """
    Gestiona todas las operaciones de base de datos para la colección de proveedores.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio con una instancia de la base de datos.

        Args:
            db: La instancia de la base de datos asíncrona (Motor).
        """
        self.collection = db.suppliers

    async def find_by_tax_id(self, tax_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un único proveedor por su ID Fiscal (tax_id).

        Args:
            tax_id: El ID Fiscal del proveedor a buscar.

        Returns:
            Un diccionario representando el documento del proveedor si se encuentra, de lo contrario None.
        """
        return await self.collection.find_one({"tax_id": tax_id})

    async def find_by_id(self, supplier_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un único proveedor por su ObjectId de MongoDB.

        Args:
            supplier_id: El ID (en formato string) del proveedor a buscar.

        Returns:
            Un diccionario representando el documento del proveedor si se encuentra, de lo contrario None.
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(supplier_id)})
        except InvalidId:
            return None

    async def find_by_ids(self, supplier_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Busca múltiples proveedores por una lista de sus IDs de MongoDB.

        Args:
            supplier_ids: Una lista de IDs (en formato string) a buscar.

        Returns:
            Una lista de diccionarios, cada uno representando un proveedor encontrado.
        """
        if not supplier_ids:
            return []
        
        object_ids = [ObjectId(sid) for sid in supplier_ids if ObjectId.is_valid(sid)]
        cursor = self.collection.find({"_id": {"$in": object_ids}})
        return await cursor.to_list(length=len(object_ids))

    async def find_ids_by_name(self, name_query: str) -> List[ObjectId]:
        """
        Busca proveedores por nombre (insensible a mayúsculas/minúsculas) y devuelve solo sus IDs.

        Args:
            name_query: El término de búsqueda para el nombre del negocio.

        Returns:
            Una lista de ObjectIds de los proveedores que coinciden.
        """
        query = {"business_name": {"$regex": name_query, "$options": "i"}}
        cursor = self.collection.find(query, {"_id": 1}) # Proyección para obtener solo el _id
        return [doc["_id"] async for doc in cursor]

    async def find_all_paginated(self, query: Dict[str, Any], skip: int, page_size: int) -> List[Dict[str, Any]]:
        """
        Encuentra múltiples documentos de proveedores con paginación.

        Args:
            query: El diccionario de consulta de MongoDB para filtrar los resultados.
            skip: El número de documentos a omitir (para la paginación).
            page_size: El número máximo de documentos a devolver.

        Returns:
            Una lista de diccionarios, cada uno representando un proveedor.
        """
        cursor = self.collection.find(query).skip(skip).limit(page_size)
        return await cursor.to_list(length=page_size)

    async def insert_one(self, supplier_doc: Dict[str, Any]) -> ObjectId:
        """
        Inserta un nuevo documento de proveedor en la colección.

        Args:
            supplier_doc: Un diccionario que representa el proveedor a crear.

        Returns:
            El ObjectId del documento recién insertado.
        """
        result = await self.collection.insert_one(supplier_doc)
        return result.inserted_id

    async def count_documents(self, query: Dict[str, Any]) -> int:
        """
        Cuenta el número total de documentos que coinciden con una consulta.

        Args:
            query: El diccionario de consulta de MongoDB.

        Returns:
            El número total de documentos coincidentes.
        """
        return await self.collection.count_documents(query)

    async def update_one_by_id(self, supplier_id: str, update_data: Dict[str, Any]) -> int:
        """
        Actualiza un documento de proveedor existente, buscándolo por su ID.

        Args:
            supplier_id: El ID del proveedor a actualizar.
            update_data: Un diccionario con los campos y valores a actualizar.

        Returns:
            El número de documentos que coincidieron con el filtro (0 o 1).
        """
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(supplier_id)},
                {"$set": update_data}
            )
            return result.matched_count
        except InvalidId:
            return 0

    async def deactivate_one_by_id(self, supplier_id: str) -> int:
        """
        Desactiva (borrado lógico) un proveedor, buscándolo por su ID.

        Args:
            supplier_id: El ID del proveedor a desactivar.

        Returns:
            El número de documentos modificados (0 o 1).
        """
        try:
            update_data = {"is_active": False}
            result = await self.collection.update_one(
                {"_id": ObjectId(supplier_id)},
                {"$set": update_data}
            )
            return result.modified_count
        except InvalidId:
            return 0