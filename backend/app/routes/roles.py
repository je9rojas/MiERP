# /backend/app/routes/roles.py
# CÓDIGO CORREGIDO Y REFACTORIZADO

from fastapi import APIRouter, Depends
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db # <-- Importamos la dependencia de DB
from app.models.user import RoleOut
from app.routes.auth import get_current_user # Reutilizamos la dependencia de autenticación
from app.services import role_service # <-- Importamos nuestro nuevo servicio

router = APIRouter(prefix="/roles", tags=["Roles Management"])

@router.get("/", response_model=List[RoleOut])
async def get_all_roles_route(
    db: AsyncIOMotorDatabase = Depends(get_db), # Inyectamos la dependencia de la DB
    _current_user: dict = Depends(get_current_user) # Se usa solo para proteger el endpoint
):
    """
    Obtiene una lista de todos los roles disponibles en el sistema.
    Protegido, requiere autenticación.
    """
    # La lógica ahora está encapsulada en la capa de servicio
    roles = await role_service.get_all_roles(db)
    return roles