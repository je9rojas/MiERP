# /backend/app/modules/purchasing/purchasing_routes.py

"""
Define los endpoints de la API para la gestión de Órdenes de Compra.

Este router expone las operaciones CRUD para las órdenes de compra, aplicando la
seguridad basada en roles y delegando toda la lógica de negocio a la capa de
servicio de compras para mantener el código limpio y organizado.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, Query, status, Response
from typing import List, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import purchasing_service
from .purchasing_models import PurchaseOrderCreate, PurchaseOrderOut, PurchaseOrderUpdate
from app.modules.auth.dependencies import get_current_active_user

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/purchase-orders",
    tags=["Compras - Órdenes de Compra"]
)

class PaginatedPurchaseOrdersResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de órdenes de compra."""
    total_count: int
    items: List[PurchaseOrderOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

@router.post(
    "",
    response_model=PurchaseOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Orden de Compra"
)
async def create_new_purchase_order(
    po_data: PurchaseOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Registra una nueva orden de compra en el sistema. El usuario que crea la orden
    se obtiene del token de autenticación.
    """
    return await purchasing_service.create_purchase_order(db, po_data, current_user)


@router.get(
    "",
    response_model=PaginatedPurchaseOrdersResponse,
    summary="Obtener lista paginada de Órdenes de Compra"
)
async def get_all_purchase_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE, UserRole.ACCOUNTANT])),
    search: Optional[str] = Query(None, description="Término de búsqueda por número de orden."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="Tamaño de la página.")
):
    """
    Recupera una lista paginada de órdenes de compra, con opción de búsqueda.
    Protegido por roles que tienen permiso para ver esta información.
    """
    result = await purchasing_service.get_purchase_orders_paginated(
        db=db, search=search, page=page, page_size=page_size
    )
    return result


@router.get(
    "/{order_id}",
    response_model=PurchaseOrderOut,
    summary="Obtener una Orden de Compra por ID",
    responses={404: {"description": "Orden de Compra no encontrada"}}
)
async def get_purchase_order_by_id_route(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """Obtiene los detalles completos de una orden de compra específica por su ID."""
    order = await purchasing_service.get_purchase_order_by_id(db, order_id)
    return order


@router.patch(
    "/{order_id}",
    response_model=PurchaseOrderOut,
    summary="Actualizar una Orden de Compra",
    responses={404: {"description": "Orden de Compra no encontrada o no editable"}}
)
async def update_purchase_order_route(
    order_id: str,
    order_data: PurchaseOrderUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]))
):
    """
    Actualiza una orden de compra. Solo se permiten actualizaciones en ciertos estados (ej. 'borrador').
    """
    updated_order = await purchasing_service.update_purchase_order(db, order_id, order_data)
    return updated_order