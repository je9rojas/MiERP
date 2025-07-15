# /backend/app/modules/roles/role_routes.py
# GESTOR DE RUTAS PARA LA ENTIDAD ROL, CON ARQUITECTURA MODULAR

from fastapi import APIRouter, Depends
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- SECCIÓN 1: IMPORTACIONES ---

# Dependencias del núcleo de la aplicación
from app.core.database import get_db

# Importaciones de otros módulos
from app.modules.users.user_models import RoleOut, UserOut
from app.modules.auth.auth_routes import get_current_active_user

# Importaciones relativas dentro del mismo módulo 'roles'
from . import role_service

# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER ---

router = APIRouter(prefix="/roles", tags=["Roles Management"])

# --- SECCIÓN 3: ENDPOINTS DE LA API ---

@router.get("/", response_model=List[RoleOut])
async def get_all_roles_route(
    db: AsyncIOMotorDatabase = Depends(get_db),
    # Usamos la dependencia mejorada para proteger el endpoint.
    # El guion bajo indica que no usaremos la variable 'current_user' en la función.
    _current_user: UserOut = Depends(get_current_active_user)
):
    """
    Obtiene una lista de todos los roles disponibles en el sistema.
    Este endpoint requiere que el usuario esté autenticado.
    """
    roles = await role_service.get_all_roles(db)
    return roles