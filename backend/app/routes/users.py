# /backend/app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import bcrypt
from datetime import datetime

from app.core.database import db_client
from app.models.user import UserCreate, UserOut, UserUpdate, UserRole
# ELIMINAMOS LA IMPORTACIÓN DE get_current_user porque ya lo usa la dependencia de rol
# from app.routes.auth import get_current_user 
from app.dependencies.roles import role_checker # <-- NUEVA IMPORTACIÓN

router = APIRouter(prefix="/users", tags=["Users Management"])

# --- LA ANTIGUA DEPENDENCIA 'get_current_admin_user' HA SIDO ELIMINADA ---

# --- ENDPOINTS CRUD AHORA USANDO LA DEPENDENCIA REUTILIZABLE ---

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_data: UserCreate,
    # El endpoint ahora declara explícitamente qué roles son necesarios
    admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Crea un nuevo usuario en el sistema. Solo para superadmin y admin."""
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
async def get_all_users(admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    """Lista todos los usuarios del sistema. Solo para superadmin y admin."""
    users_cursor = db_client.db.users.find({})
    users = await users_cursor.to_list(length=1000)
    return users

@router.get("/{username}", response_model=UserOut)
async def get_user_by_username_route(
    username: str,
    admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Obtiene un usuario específico por su nombre de usuario. Solo para superadmin y admin."""
    user = await db_client.db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user

@router.put("/{username}", response_model=UserOut)
async def update_user_details(
    username: str,
    user_update_data: UserUpdate,
    admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Actualiza los detalles de un usuario. Solo para superadmin y admin."""
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
    admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Desactiva un usuario (soft delete). Solo para superadmin y admin."""
    if admin_user["username"] == username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivarte a ti mismo")

    result = await db_client.db.users.update_one(
        {"username": username},
        {"$set": {"status": "inactive"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None