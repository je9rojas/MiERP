# /backend/app/repositories/base_repository.py

"""
Define la Clase Base para todos los Repositorios de la Aplicación.

Este módulo introduce un patrón de Repositorio Genérico para estandarizar el acceso
a la base de datos y eliminar código duplicado. La clase `BaseRepository` utiliza
genéricos de Python para proporcionar operaciones CRUD y de agregación,
fuertemente tipadas para cualquier modelo de Pydantic.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorCollection, AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo.results import InsertOneResult, UpdateResult

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE TIPOS GENÉRICOS
# ==============================================================================

ModelType = TypeVar("ModelType", bound=BaseModel)

# ==============================================================================
# SECCIÓN 3: CLASE BASE DEL REPOSITORIO
# ==============================================================================

class BaseRepository(Generic[ModelType]):
    """
    Repositorio base con operaciones CRUD genéricas y de agregación para una
    colección de MongoDB.
    """

    def __init__(self, database: AsyncIOMotorDatabase, collection_name: str, model: Type[ModelType]):
        """
        Inicializa el repositorio base.

        Args:
            database: La instancia de la base de datos asíncrona de Motor.
            collection_name: El nombre de la colección de MongoDB.
            model: El modelo de Pydantic que representa los documentos.
        """
        self.db: AsyncIOMotorDatabase = database
        self.collection: AsyncIOMotorCollection = self.db[collection_name]
        self.model: Type[ModelType] = model

    async def find_one_by_id(self, document_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Busca un único documento por su _id."""
        return await self.collection.find_one({"_id": PyObjectId(document_id)}, session=session)

    async def find_one_by(self, query: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Busca un único documento que coincida con un filtro."""
        return await self.collection.find_one(query, session=session)

    async def find_all(
        self,
        query: Dict[str, Any],
        sort: Optional[List[tuple]] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """
        (NUEVO) Busca todos los documentos que coincidan con un filtro, sin paginación.
        
        Ideal para operaciones de exportación o cuando se necesita el conjunto
        completo de datos.

        Args:
            query: El filtro de MongoDB para la búsqueda.
            sort: Una lista de tuplas para el ordenamiento (ej. [("field", 1)]).
            session: Una sesión opcional de Motor para operaciones transaccionales.

        Returns:
            Una lista de todos los documentos que coinciden.
        """
        cursor = self.collection.find(query, session=session)
        if sort:
            cursor = cursor.sort(sort)
        return await cursor.to_list(length=None) # length=None para obtener todos los documentos

    async def find_all_paginated(
        self,
        query: Dict[str, Any],
        skip: int,
        limit: int,
        sort: Optional[List[tuple]] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> List[Dict[str, Any]]:
        """Busca múltiples documentos con paginación y ordenamiento."""
        cursor = self.collection.find(query, session=session).skip(skip).limit(limit)
        if sort:
            cursor = cursor.sort(sort)
        return await cursor.to_list(length=limit)

    async def find_by_ids(self, document_ids: List[str], session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Busca múltiples documentos a partir de una lista de IDs."""
        object_ids = [PyObjectId(doc_id) for doc_id in document_ids]
        cursor = self.collection.find({"_id": {"$in": object_ids}}, session=session)
        return await cursor.to_list(length=len(document_ids))
        
    async def insert_one(self, document_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> PyObjectId:
        """Inserta un nuevo documento en la colección."""
        result: InsertOneResult = await self.collection.insert_one(document_data, session=session)
        return result.inserted_id

    async def execute_update_one_by_id(self, document_id: str, update_data: Dict[str, Any], session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Actualiza un único documento por su ID."""
        result: UpdateResult = await self.collection.update_one(
            {"_id": PyObjectId(document_id)},
            update_data,
            session=session
        )
        return result.modified_count

    async def count_documents(self, query: Optional[Dict[str, Any]] = None, session: Optional[AsyncIOMotorClientSession] = None) -> int:
        """Cuenta el número de documentos que coinciden con un filtro."""
        query = query or {}
        return await self.collection.count_documents(query, session=session)
        
    async def find_one_sorted(self, sort: List[tuple], query: Optional[Dict[str, Any]] = None, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """Encuentra el primer documento según un criterio de ordenamiento."""
        query = query or {}
        return await self.collection.find_one(filter=query, sort=sort, session=session)

    async def aggregate(self, pipeline: List[Dict[str, Any]], session: Optional[AsyncIOMotorClientSession] = None) -> List[Dict[str, Any]]:
        """Ejecuta un pipeline de agregación de MongoDB en la colección."""
        cursor = self.collection.aggregate(pipeline, session=session)
        return await cursor.to_list(length=None)