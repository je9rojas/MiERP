# /backend/app/routes/roles.py

from fastapi import APIRouter, Depends
from typing import List
from app.core.database import db_client
from app.models.user import RoleOut
from app.routes.auth import get_current_user # Reutilizamos la dependencia de autenticación

router = APIRouter(prefix="/roles", tags=["Roles Management"])

@router.get("/", response_model=List[RoleOut])
async def get_all_roles(current_user: dict = Depends(get_current_user)):
    """
    Obtiene una lista de todos los roles disponibles en el sistema.
    Protegido, requiere autenticación para que el frontend pueda usarlo.
    """
    # Excluimos el _id de MongoDB en la respuesta
    roles_cursor = db_client.db.roles.find({}, {"_id": 0})
    roles = await roles_cursor.to_list(length=100)
    return roles