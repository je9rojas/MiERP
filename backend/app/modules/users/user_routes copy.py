# /backend/app/modules/users/user_routes.py
# CÓDIGO CORREGIDO Y REFACTORIZADO USANDO CAPA DE SERVICIO

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db # <-- Importamos la dependencia de DB

from .user_models import UserCreate, UserOut, UserUpdate, UserRole
from app.dependencies.roles import role_checker
from app.modules.users import user_service # <-- Importamos nuestro nuevo servicio

router = APIRouter(prefix="/users", tags=["Users Management"])

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db), # Inyectamos la DB
    _admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN])) # El guion bajo indica que no usamos la variable directamente
):
    """Crea un nuevo usuario en el sistema. Solo para superadmin y admin."""
    existing_user = await user_service.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre de usuario ya existe")

    created_user = await user_service.create_user(db, user_data)
    return created_user

@router.get("/", response_model=List[UserOut])
async def get_all_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Lista todos los usuarios del sistema. Solo para superadmin y admin."""
    users = await user_service.get_all_users(db)
    return users

@router.get("/{username}", response_model=UserOut)
async def get_user_by_username_route(
    username: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Obtiene un usuario específico por su nombre de usuario. Solo para superadmin y admin."""
    user = await user_service.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user

@router.put("/{username}", response_model=UserOut)
async def update_user_details(
    username: str,
    user_update_data: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Actualiza los detalles de un usuario. Solo para superadmin y admin."""
    if not user_update_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar")
        
    updated_user = await user_service.update_user(db, username, user_update_data)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado o sin cambios")
    return updated_user

@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_by_username(
    username: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Desactiva un usuario (soft delete). Solo para superadmin y admin."""
    if admin_user["username"] == username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivarte a ti mismo")
    
    success = await user_service.soft_delete_user(db, username)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None