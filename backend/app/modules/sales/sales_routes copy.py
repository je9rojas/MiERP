# /backend/app/modules/sales/sales_routes.py

"""
Define los endpoints de la API para la gestión de Órdenes de Venta.

Este router expone las operaciones para crear y consultar órdenes de venta,
aplicando la seguridad basada en roles y delegando toda la lógica de negocio
a la capa de servicio de ventas.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import sales_service
from .sales_models import SalesOrderCreate, SalesOrderOut
from app.modules.auth.dependencies import get_current_active_user

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/sales-orders",
    tags=["Ventas - Órdenes de Venta"]
)

class PaginatedSalesOrdersResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de órdenes de venta."""
    total_count: int
    items: List[SalesOrderOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

@router.post(
    "",
    response_model=SalesOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Orden de Venta",
    description="Registra una nueva orden de venta y descuenta el stock correspondiente."
)
async def create_new_sales_order(
    so_data: SalesOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker(
        [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER]
    ))
):
    """
    Endpoint para crear una nueva orden de venta. El usuario que crea la orden
    se obtiene del token de autenticación.
    """
    return await sales_service.create_sales_order(db, so_data, current_user)

# --- Endpoints Futuros (Esqueletos) ---

@router.get(
    "",
    response_model=PaginatedSalesOrdersResponse,
    summary="Obtener lista paginada de Órdenes de Venta"
)
async def get_all_sales_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """
    (Implementación futura) Recupera una lista paginada de órdenes de venta.
    """
    # Aquí iría la llamada a `sales_service.get_sales_orders_paginated(...)`
    return {"total_count": 0, "items": []}

@router.get(
    "/{order_id}",
    response_model=SalesOrderOut,
    summary="Obtener una Orden de Venta por ID"
)
async def get_sales_order_by_id_route(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    (Implementación futura) Obtiene los detalles de una orden de venta específica.
    """
    # Aquí iría la llamada a `sales_service.get_sales_order_by_id(...)`
    raise status.HTTP_501_NOT_IMPLEMENTED