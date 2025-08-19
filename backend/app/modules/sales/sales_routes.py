# /backend/app/modules/sales/sales_routes.py

"""
[VERSIÓN DE DEPURACIÓN] Define los endpoints de la API para el Módulo de Ventas.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import sales_service
from .sales_models import (
    SalesOrderCreate, SalesOrderOut, SalesOrderStatus,
    ShipmentCreate, ShipmentOut,
    SalesInvoiceCreate, SalesInvoiceOut
)
from app.modules.auth.dependencies import get_current_active_user

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/sales",
    tags=["Ventas"]
)

class PaginatedSalesOrdersResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de órdenes de venta."""
    total_count: int
    items: List[SalesOrderOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS PARA ÓRDENES DE VENTA (SALES ORDERS)
# ==============================================================================

@router.post(
    "/orders",
    response_model=SalesOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear Orden de Venta"
)
async def create_new_sales_order(
    so_data: SalesOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))
):
    """Crea una nueva orden de venta, asignando al usuario actual como creador."""
    # --- LOG DE DEPURACIÓN ---
    print("\n[BACKEND_DEBUG] 1. Petición POST a /sales/orders LLEGÓ a la función `create_new_sales_order`.")
    print(f"[BACKEND_DEBUG] 2. Payload recibido y validado por Pydantic: {so_data.model_dump_json(indent=2)}")
    print("[BACKEND_DEBUG] 3. A punto de llamar a `sales_service.create_sales_order`...")
    # --- FIN LOG ---
    
    result = await sales_service.create_sales_order(db, so_data, current_user)
    
    # --- LOG DE DEPURACIÓN ---
    print("[BACKEND_DEBUG] 6. La función del servicio se completó. A punto de devolver la respuesta.")
    # --- FIN LOG ---
    
    return result

# ... (El resto de los endpoints no necesitan cambios por ahora)

@router.patch(
    "/orders/{order_id}/confirm",
    response_model=SalesOrderOut,
    summary="Confirmar Orden de Venta"
)
async def confirm_sales_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))
):
    """Cambia el estado de una orden de venta a 'Confirmado'."""
    return await sales_service.update_sales_order_status(db, order_id, SalesOrderStatus.CONFIRMED)


@router.get(
    "/orders",
    response_model=PaginatedSalesOrdersResponse,
    summary="Listar Órdenes de Venta"
)
async def get_all_sales_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Término de búsqueda."),
    status: Optional[SalesOrderStatus] = Query(None, description="Filtrar por estado."),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100)
) -> Dict[str, Any]:
    """Obtiene una lista paginada de órdenes de venta con filtros opcionales."""
    return await sales_service.get_sales_orders_paginated(db, page, page_size, search, status)


@router.get(
    "/orders/{order_id}",
    response_model=SalesOrderOut,
    summary="Obtener Orden de Venta por ID"
)
async def get_sales_order_by_id_route(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """Recupera los detalles completos de una orden de venta específica."""
    return await sales_service.get_sales_order_by_id(db, order_id)

# ==============================================================================
# SECCIÓN 4: ENDPOINTS PARA DESPACHOS (SHIPMENTS)
# ==============================================================================
@router.post(
    "/orders/{order_id}/shipments",
    response_model=ShipmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Despacho desde una Orden de Venta"
)
async def create_shipment(
    order_id: str,
    shipment_data: ShipmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WAREHOUSE]))
):
    return await sales_service.create_shipment_from_sales_order(db, order_id, shipment_data, current_user)

# ==============================================================================
# SECCIÓN 5: ENDPOINTS PARA FACTURAS DE VENTA (SALES INVOICES)
# ==============================================================================
@router.post(
    "/orders/{order_id}/invoice",
    response_model=SalesInvoiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una Factura desde una Orden de Venta"
)
async def create_invoice_for_order(
    order_id: str,
    invoice_data: SalesInvoiceCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]))
):
    return await sales_service.create_invoice_from_shipments(db, order_id, invoice_data, current_user)