# /backend/app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import bcrypt
from datetime import datetime

from app.core.database import db_client
from app.models.user import UserCreate, UserOut, UserUpdate, UserRole
from app.routes.auth import get_current_user

router = APIRouter()

# --- DEPENDENCIA DE SEGURIDAD ESPECÍFICA PARA ADMINS ---
async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """
    Dependencia que verifica si el usuario actual es 'superadmin' o 'admin'.
    Si no lo es, lanza una excepción de acceso denegado.
    """
    if current_user.get("role") not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )
    return current_user

# --- ENDPOINTS CRUD ---

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_data: UserCreate,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Crea un nuevo usuario en el sistema. Solo para administradores."""
    existing_user = await db_client.db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre de usuario ya existe")

    password_hash = bcrypt.hashpw(
        user_data.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    new_user_doc = user_data.model_dump()
    del new_user_doc["password"]
    new_user_doc["password_hash"] = password_hash
    new_user_doc["status"] = "active"
    new_user_doc["created_at"] = datetime.utcnow()
    
    result = await db_client.db.users.insert_one(new_user_doc)
    created_user = await db_client.db.users.find_one({"_id": result.inserted_id})
    
    return created_user

@router.get("/", response_model=List[UserOut])
async def get_all_users(admin_user: dict = Depends(get_current_admin_user)):
    """Lista todos los usuarios del sistema. Solo para administradores."""
    users_cursor = db_client.db.users.find({})
    users = await users_cursor.to_list(length=1000)
    return users

@router.get("/{username}", response_model=UserOut)
async def get_user_by_username_route(
    username: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Obtiene un usuario específico por su nombre de usuario. Solo para administradores."""
    user = await db_client.db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user

@router.put("/{username}", response_model=UserOut)
async def update_user_details(
    username: str,
    user_update_data: UserUpdate,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Actualiza los detalles de un usuario. Solo para administradores."""
    update_data = user_update_data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar")

    result = await db_client.db.users.update_one(
        {"username": username},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        
    updated_user = await db_client.db.users.find_one({"username": username})
    return updated_user

@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_by_username(
    username: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Desactiva un usuario (soft delete). Solo para administradores."""
    if admin_user["username"] == username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivarte a ti mismo")

    result = await db_client.db.users.update_one(
        {"username": username},
        {"$set": {"status": "inactive"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None