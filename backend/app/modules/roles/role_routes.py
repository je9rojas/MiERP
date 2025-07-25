# /backend/app/modules/roles/role_routes.py

from fastapi import APIRouter, Depends
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole

# --- ¡CORRECCIÓN CLAVE AQUÍ! ---
# Se importa 'RoleOut' desde su nuevo archivo de modelos 'role_models.py'.
# 'UserOut' (si fuera necesario) se seguiría importando de 'user_models.py'.
from .role_models import RoleOut
from . import role_service

router = APIRouter(prefix="/roles", tags=["Sistema - Roles"])

@router.get("/", response_model=List[RoleOut])
async def get_all_roles(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user = Depends(role_checker([UserRole.ADMIN])) # Solo los admins pueden ver los roles
):
    """
    Obtiene una lista de todos los roles definidos en el sistema.
    """
    roles = await role_service.get_all_roles(db)
    return roles

# Aquí podrías añadir más endpoints en el futuro para crear/editar roles,
# siempre protegidos por el role_checker.