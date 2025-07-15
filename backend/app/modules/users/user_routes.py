# /backend/app/modules/users/user_routes.py
# GESTOR DE RUTAS PARA LA ENTIDAD USUARIO, CON ARQUITECTURA MODULAR

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- SECCIÓN 1: IMPORTACIONES ---

# Dependencias del núcleo de la aplicación y otros módulos
from app.core.database import get_db
from app.dependencies.roles import role_checker

# Importaciones relativas dentro del mismo módulo 'users'
from .user_models import UserCreate, UserOut, UserUpdate, UserRole
from . import user_service # <-- CAMBIO: Usamos una importación relativa

# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER ---

router = APIRouter(prefix="/users", tags=["Users Management"])

# --- SECCIÓN 3: ENDPOINTS DEL CRUD DE USUARIOS ---

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Crea un nuevo usuario en el sistema.
    Requiere rol de Superadmin o Admin.
    """
    existing_user = await user_service.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso."
        )

    created_user = await user_service.create_user(db, user_data)
    return created_user

@router.get("/", response_model=List[UserOut])
async def get_all_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Obtiene una lista de todos los usuarios del sistema.
    Requiere rol de Superadmin o Admin.
    """
    users = await user_service.get_all_users(db)
    return users

@router.get("/{username}", response_model=UserOut)
async def get_user_by_username_route(
    username: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Obtiene los detalles de un usuario específico por su nombre de usuario.
    Requiere rol de Superadmin o Admin.
    """
    user = await user_service.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user

@router.put("/{username}", response_model=UserOut)
async def update_user_details(
    username: str,
    user_update_data: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Actualiza los detalles de un usuario existente.
    Requiere rol de Superadmin o Admin.
    """
    if not user_update_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar")
        
    updated_user = await user_service.update_user(db, username, user_update_data)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado o sin cambios que aplicar")
    return updated_user

@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user_by_username(
    username: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Desactiva un usuario (soft delete).
    Requiere rol de Superadmin o Admin.
    """
    if admin_user.username == username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivarte a ti mismo")
    
    success = await user_service.soft_delete_user(db, username)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None