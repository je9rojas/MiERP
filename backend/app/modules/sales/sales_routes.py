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

from fastapi import APIRouter, Depends, Query, status, HTTPException
from typing import List, Optional, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import sales_service
from .sales_models import SalesOrderCreate, SalesOrderOut, SalesOrderStatus
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
    description="Registra una nueva orden de venta y descuenta el stock correspondiente de los lotes."
)
async def create_new_sales_order(
    so_data: SalesOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker(
        [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER]
    ))
):
    """
    Endpoint para crear una nueva orden de venta.
    """
    return await sales_service.create_sales_order(db, so_data, current_user)


@router.get(
    "",
    response_model=PaginatedSalesOrdersResponse,
    summary="Obtener lista paginada de Órdenes de Venta"
)
async def get_all_sales_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Término de búsqueda por N° de Orden o nombre de cliente."),
    status: Optional[SalesOrderStatus] = Query(None, description="Filtrar por estado de la orden."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(25, ge=1, le=100, alias="page_size")
):
    """
    Recupera una lista paginada de órdenes de venta con opciones de filtrado.
    """
    result = await sales_service.get_sales_orders_paginated(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        status=status
    )
    return result


@router.get(
    "/{order_id}",
    response_model=SalesOrderOut,
    summary="Obtener una Orden de Venta por ID",
    responses={404: {"description": "Orden de Venta no encontrada"}}
)
async def get_sales_order_by_id_route(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de una orden de venta específica.
    """
    order = await sales_service.get_sales_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden de venta con ID '{order_id}' no encontrada."
        )
    return order