# /backend/app/modules/users/user_service.py
# SERVICIO FINAL Y PROFESIONAL PARA LA GESTIÓN DE USUARIOS

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- Importaciones ---
from app.core.security import get_password_hash # Importamos nuestra función de hashing
from .user_models import UserCreate, UserUpdate, UserInDB
from .repositories.user_repository import UserRepository # Importamos el repositorio

# --- FUNCIONES DEL SERVICIO ---

async def get_user_by_username(db: AsyncIOMotorDatabase, username: str) -> Optional[UserInDB]:
    """Busca un usuario por su nombre de usuario usando el repositorio."""
    repo = UserRepository(db)
    user_doc = await repo.find_one_by_username(username)
    if user_doc:
        return UserInDB(**user_doc)
    return None

async def get_all_users(db: AsyncIOMotorDatabase) -> List[UserInDB]:
    """Obtiene una lista de todos los usuarios usando el repositorio."""
    repo = UserRepository(db)
    user_docs = await repo.find_all()
    return [UserInDB(**user) for user in user_docs]

async def create_user(db: AsyncIOMotorDatabase, user_data: UserCreate) -> UserInDB:
    """Crea un nuevo documento de usuario usando el repositorio."""
    repo = UserRepository(db)
    
    # Lógica de negocio: Validar que el usuario no exista
    if await repo.find_one_by_username(user_data.username):
        raise ValueError(f"El nombre de usuario '{user_data.username}' ya está en uso.")

    # Usamos nuestra función de seguridad centralizada
    hashed_password = get_password_hash(user_data.password)
    
    # Construimos el objeto completo para la base de datos
    user_to_db = UserInDB(
        **user_data.model_dump(exclude={"password"}),
        password_hash=hashed_password
    )
    
    user_doc = user_to_db.model_dump(by_alias=True)
    inserted_id = await repo.insert_one(user_doc)
    
    created_user_doc = await repo.find_one_by_id(str(inserted_id))
    return UserInDB(**created_user_doc)


async def update_user(db: AsyncIOMotorDatabase, username: str, user_update_data: UserUpdate) -> Optional[UserInDB]:
    """Actualiza los datos de un usuario existente usando el repositorio."""
    repo = UserRepository(db)
    update_data = user_update_data.model_dump(exclude_unset=True)
    
    if not update_data:
        return await get_user_by_username(db, username)

    update_data["updated_at"] = datetime.now(timezone.utc)
    
    matched_count = await repo.update_one_by_username(username, update_data)
    
    if matched_count > 0:
        return await get_user_by_username(db, username)
    return None

async def soft_delete_user(db: AsyncIOMotorDatabase, username: str) -> bool:
    """Desactiva un usuario (borrado lógico) usando el repositorio."""
    repo = UserRepository(db)
    update_data = {
        "status": "inactive",
        "updated_at": datetime.now(timezone.utc)
    }
    matched_count = await repo.update_one_by_username(username, update_data)
    return matched_count > 0