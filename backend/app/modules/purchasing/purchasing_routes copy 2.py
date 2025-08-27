# /backend/app/modules/purchasing/purchasing_routes.py

"""
Define los Endpoints de la API REST para el Módulo de Compras (Purchasing).

Este router actúa como la puerta de entrada para todas las operaciones relacionadas
con el flujo "Procure-to-Pay". Su única responsabilidad es definir las rutas,
validar los datos de entrada y salida a través de los modelos Pydantic, y delegar
la ejecución de la lógica de negocio a los servicios especializados correspondientes:
- purchase_order_service.py
- goods_receipt_service.py
- purchase_bill_service.py

Este enfoque garantiza que la capa de API permanezca delgada y desacoplada de la
lógica de negocio subyacente.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.models.shared import PyObjectId
from app.modules.auth.dependencies import get_current_active_user
from app.modules.purchasing import (
    goods_receipt_service,
    purchase_bill_service,
    purchase_order_service
)
from app.modules.users.user_models import UserOut, UserRole
from .purchasing_models import (
    GoodsReceiptCreate,
    GoodsReceiptOut,
    PurchaseBillCreate,
    PurchaseBillOut,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    PurchaseOrderStatus,
    PurchaseOrderUpdate
)

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/purchasing",
    tags=["Compras"]
)

# Modelos específicos para las respuestas paginadas, mejorando la documentación de la API.
class PaginatedPurchaseOrdersResponse(BaseModel):
    total_count: int
    items: List[PurchaseOrderOut]

class PaginatedGoodsReceiptsResponse(BaseModel):
    total_count: int
    items: List[GoodsReceiptOut]

class PaginatedPurchaseBillsResponse(BaseModel):
    total_count: int
    items: List[PurchaseBillOut]

# Modelo para el payload de actualización de estado.
class UpdateStatusPayload(BaseModel):
    new_status: PurchaseOrderStatus


# ==============================================================================
# SECCIÓN 3: ENDPOINTS PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

@router.post(
    "/orders",
    response_model=PurchaseOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Orden de Compra",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_new_purchase_order(
    order_data: PurchaseOrderCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la creación de una orden de compra al servicio correspondiente."""
    return await purchase_order_service.create_purchase_order(database, order_data, current_user)

@router.get(
    "/orders",
    response_model=PaginatedPurchaseOrdersResponse,
    summary="Listar Órdenes de Compra con paginación"
)
async def get_all_purchase_orders(
    search: Optional[str] = Query(None, description="Buscar por N° de orden o nombre de proveedor."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de la página."),
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Delega la obtención de órdenes de compra paginadas al servicio correspondiente."""
    return await purchase_order_service.get_purchase_orders_paginated(database, page, page_size, search)

@router.get(
    "/orders/{order_id}",
    response_model=PurchaseOrderOut,
    summary="Obtener una Orden de Compra por su ID"
)
async def get_purchase_order_by_id_route(
    order_id: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la búsqueda de una orden de compra por ID al servicio correspondiente."""
    return await purchase_order_service.get_purchase_order_by_id(database, order_id)

@router.patch(
    "/orders/{order_id}",
    response_model=PurchaseOrderOut,
    summary="Actualizar detalles de una Orden de Compra en borrador",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_purchase_order_details(
    order_id: str,
    update_data: PurchaseOrderUpdate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Delega la actualización de los campos de una Orden de Compra.
    La lógica de negocio para validar el estado editable reside en el servicio.
    """
    return await purchase_order_service.update_purchase_order(database, order_id, update_data)

@router.patch(
    "/orders/{order_id}/status",
    response_model=PurchaseOrderOut,
    summary="Actualizar el estado de una Orden de Compra",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_order_status_route(
    order_id: str,
    payload: UpdateStatusPayload,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la actualización de estado de una OC al servicio, que contiene la lógica de transiciones válidas."""
    return await purchase_order_service.update_purchase_order_status(database, order_id, payload.new_status)


# ==============================================================================
# SECCIÓN 4: ENDPOINTS PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

@router.post(
    "/receipts",
    response_model=GoodsReceiptOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una nueva Recepción de Mercancía",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.WAREHOUSE]))]
)
async def register_goods_receipt(
    receipt_data: GoodsReceiptCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la creación de una recepción de mercancía al servicio correspondiente."""
    return await goods_receipt_service.create_goods_receipt(database, receipt_data, current_user)

@router.get(
    "/receipts",
    response_model=PaginatedGoodsReceiptsResponse,
    summary="Listar todas las Recepciones de Mercancía"
)
async def get_all_goods_receipts(
    search: Optional[str] = Query(None, description="Buscar por número de recepción."),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Delega la obtención de recepciones paginadas al servicio correspondiente."""
    return await goods_receipt_service.get_goods_receipts_paginated(database, page, page_size, search)

@router.get(
    "/receipts/{receipt_id}",
    response_model=GoodsReceiptOut,
    summary="Obtener una Recepción de Mercancía por su ID"
)
async def get_goods_receipt_by_id_route(
    receipt_id: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la búsqueda de una recepción por ID al servicio correspondiente."""
    return await goods_receipt_service.get_goods_receipt_by_id(database, receipt_id)


# ==============================================================================
# SECCIÓN 5: ENDPOINTS PARA FACTURAS DE COMPRA (PURCHASE BILL)
# ==============================================================================

@router.post(
    "/bills",
    response_model=PurchaseBillOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Factura de Compra",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.ACCOUNTANT]))]
)
async def create_new_purchase_bill(
    bill_data: PurchaseBillCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la creación de una factura de compra al servicio correspondiente."""
    return await purchase_bill_service.create_purchase_bill(database, bill_data, current_user)

@router.get(
    "/bills",
    response_model=PaginatedPurchaseBillsResponse,
    summary="Listar Facturas de Compra con paginación"
)
async def get_all_purchase_bills(
    search: Optional[str] = Query(None, description="Buscar por N° de factura interno o del proveedor."),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Delega la obtención de facturas paginadas al servicio correspondiente."""
    return await purchase_bill_service.get_purchase_bills_paginated(database, page, page_size, search)

@router.get(
    "/bills/{bill_id}",
    response_model=PurchaseBillOut,
    summary="Obtener una Factura de Compra por su ID"
)
async def get_bill_by_id_route(
    bill_id: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Delega la búsqueda de una factura por ID al servicio correspondiente."""
    return await purchase_bill_service.get_purchase_bill_by_id(database, bill_id)