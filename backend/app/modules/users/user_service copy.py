# /backend/app/modules/users/user_service.py
# NUEVO ARCHIVO DE SERVICIO PARA LA GESTIÓN DE USUARIOS

from datetime import datetime
from typing import List, Dict, Any
import bcrypt
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from .user_models import UserCreate, UserUpdate, UserInDB

# --- FUNCIONES CRUD PARA USUARIOS ---

async def get_user_by_username(db: AsyncIOMotorDatabase, username: str) -> Dict[str, Any] | None:
    """Busca un usuario por su nombre de usuario."""
    user = await db.users.find_one({"username": username})
    if user:
        user["_id"] = str(user["_id"])
    return user

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any] | None:
    """Busca un usuario por su ID."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
    return user

async def get_all_users(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """Obtiene una lista de todos los usuarios."""
    users_list = []
    users_cursor = db.users.find({})
    async for user in users_cursor:
        user["_id"] = str(user["_id"])
        users_list.append(user)
    return users_list

async def create_user(db: AsyncIOMotorDatabase, user_data: UserCreate) -> Dict[str, Any]:
    """Crea un nuevo documento de usuario en la base de datos."""
    password_hash = bcrypt.hashpw(
        user_data.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Usamos model_dump para convertir el modelo Pydantic a un diccionario
    new_user_doc = user_data.model_dump()
    # Eliminamos el campo de contraseña en texto plano
    del new_user_doc["password"]
    
    # Añadimos los campos generados por el servidor
    new_user_doc["password_hash"] = password_hash
    new_user_doc["status"] = "active"
    new_user_doc["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(new_user_doc)
    
    # Obtenemos el usuario recién creado para devolverlo completo
    created_user = await get_user_by_id(db, str(result.inserted_id))
    return created_user

async def update_user(db: AsyncIOMotorDatabase, username: str, user_update_data: UserUpdate) -> Dict[str, Any] | None:
    """Actualiza los datos de un usuario existente."""
    # model_dump con exclude_unset=True asegura que solo actualicemos los campos que se enviaron
    update_data = user_update_data.model_dump(exclude_unset=True)
    
    if not update_data:
        return None  # No hay nada que actualizar

    result = await db.users.update_one(
        {"username": username},
        {"$set": update_data}
    )

    if result.matched_count > 0:
        return await get_user_by_username(db, username)
    
    return None

async def soft_delete_user(db: AsyncIOMotorDatabase, username: str) -> bool:
    """Desactiva un usuario (borrado lógico) cambiando su estado a 'inactive'."""
    result = await db.users.update_one(
        {"username": username},
        {"$set": {"status": "inactive"}}
    )
    return result.matched_count > 0