# /backend/app/modules/users/repositories/user_repository.py

"""
Capa de Repositorio para la entidad 'Usuario' (User).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente con la
colección de 'users' en la base de datos MongoDB. Hereda la funcionalidad
CRUD común de BaseRepository y añade métodos de consulta específicos para usuarios.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Optional, Dict, Any

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession

# Se importa la clase base para heredar su funcionalidad.
from app.repositories.base_repository import BaseRepository
# Se importa el modelo Pydantic que representa al usuario en la base de datos.
from ..user_models import UserInDB

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class UserRepository(BaseRepository[UserInDB]):
    """
    Gestiona las operaciones de base de datos para la colección de usuarios.

    Hereda de `BaseRepository` para obtener métodos CRUD estandarizados como
    `find_one_by_id`, `insert_one`, `count_documents`, etc.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de usuarios.

        Args:
            database: La instancia de la base de datos asíncrona (Motor).
        """
        # Se llama al constructor de la clase base, proporcionando el nombre de
        # la colección y el modelo Pydantic con el que trabajará.
        super().__init__(
            database=database,
            collection_name="users",
            model=UserInDB
        )

    async def find_one_by_username(
        self,
        username: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca un único usuario por su nombre de usuario (campo único).

        Args:
            username: El nombre de usuario a buscar.
            session: Una sesión de cliente de MongoDB opcional para transacciones.

        Returns:
            Un diccionario representando el documento del usuario si se encuentra,
            de lo contrario None.
        """
        return await self.find_one_by({"username": username}, session=session)

    async def update_one_by_username(
        self,
        username: str,
        update_data: Dict[str, Any],
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Actualiza un documento de usuario buscando por su nombre de usuario.

        Args:
            username: El nombre de usuario del documento a actualizar.
            update_data: El payload con los operadores de actualización de MongoDB
                         (ej. {"$set": ...}).
            session: Una sesión opcional para transacciones.

        Returns:
            El número de documentos modificados (0 o 1).
        """
        result = await self.collection.update_one(
            {"username": username},
            {"$set": update_data},
            session=session
        )
        return result.modified_count