# /backend/app/modules/inventory/inventory_routes.py

"""
Define los endpoints de la API para las operaciones transaccionales del Inventario.

Este router gestiona las rutas relacionadas con los lotes de inventario,
transferencias, ajustes y otras operaciones que afectan directamente al stock.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, Query
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import inventory_service
from .inventory_models import InventoryLotOut

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL ROUTER
# ==============================================================================

router = APIRouter(
    prefix="/inventory-lots",
    tags=["Inventario - Lotes"]
)

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

@router.get(
    "",
    response_model=List[InventoryLotOut],
    summary="Obtener lotes de inventario por producto",
    description="Recupera todos los lotes de inventario activos para un producto específico."
)
async def get_inventory_lots_for_product(
    product_id: str = Query(..., description="El ID del producto para el cual obtener los lotes."),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]))
):
    """
    Endpoint para obtener la lista de lotes de un producto.

    Utiliza un parámetro de consulta `product_id` para filtrar los lotes, lo que
    proporciona una API flexible y desacoplada.
    """
    lots = await inventory_service.get_lots_by_product_id(db, product_id)
    return lots