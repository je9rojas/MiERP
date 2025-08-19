# backend/app/modules/purchasing/purchasing_routes.py

"""
Define los endpoints de la API REST para el Módulo de Compras (Purchasing).

Este router expone operaciones para las tres entidades principales del flujo
"Procure-to-Pay":
1.  **Órdenes de Compra (Purchase Orders):** /orders
2.  **Recepciones de Mercancía (Goods Receipts):** /receipts
3.  **Facturas de Compra (Purchase Bills):** /bills

La responsabilidad de este módulo es exclusivamente definir las rutas, validar
los datos de entrada (payloads) y de salida (`response_model`), y delegar
toda la lógica de negocio a la capa de servicio (`purchasing_service`).
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
from fastapi import APIRouter, Depends, Query, status, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from app.modules.auth.dependencies import get_current_active_user
from . import purchasing_service
from .purchasing_models import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderOut, PurchaseOrderStatus,
    GoodsReceiptCreate, GoodsReceiptOut,
    PurchaseBillCreate, PurchaseBillOut
)

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS ESPECÍFICOS DE LA API
# ==============================================================================

router = APIRouter(
    prefix="/purchasing",
    tags=["Compras"]
)

class PaginatedPurchaseOrdersResponse(BaseModel):
    """Modelo de respuesta para la lista paginada de Órdenes de Compra."""
    total_count: int
    items: List[PurchaseOrderOut]

class PaginatedGoodsReceiptsResponse(BaseModel):
    """Modelo de respuesta para la lista paginada de Recepciones de Mercancía."""
    total_count: int
    items: List[GoodsReceiptOut]

class PaginatedPurchaseBillsResponse(BaseModel):
    """Modelo de respuesta para la lista paginada de Facturas de Compra."""
    total_count: int
    items: List[PurchaseBillOut]

class UpdateStatusPayload(BaseModel):
    """Modelo para el payload de actualización de estado de una OC."""
    new_status: PurchaseOrderStatus

# ==============================================================================
# SECCIÓN 3: ENDPOINTS PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

@router.post(
    "/orders",
    response_model=PurchaseOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Orden de Compra",
    dependencies=[Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_new_purchase_order(
    po_data: PurchaseOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Crea una Orden de Compra. Por defecto, su estado inicial es 'Borrador' (Draft)."""
    return await purchasing_service.create_purchase_order(db, po_data, current_user)

@router.get(
    "/orders",
    response_model=PaginatedPurchaseOrdersResponse,
    summary="Listar y buscar Órdenes de Compra paginadas"
)
async def get_all_purchase_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Término para buscar por N° de orden o nombre de proveedor."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de la página.")
) -> Dict[str, Any]:
    """Obtiene una lista paginada de todas las órdenes de compra."""
    return await purchasing_service.get_purchase_orders_paginated(db=db, search=search, page=page, page_size=page_size)

@router.get(
    "/orders/{order_id}",
    response_model=PurchaseOrderOut,
    summary="Obtener una Orden de Compra por su ID"
)
async def get_purchase_order_by_id_route(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """Recupera los detalles completos de una orden de compra específica."""
    return await purchasing_service.get_purchase_order_by_id(db, order_id)

@router.put(
    "/orders/{order_id}",
    response_model=PurchaseOrderOut,
    summary="Actualizar una Orden de Compra",
    dependencies=[Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_purchase_order_route(
    order_id: str,
    po_data: PurchaseOrderUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Actualiza los detalles de una Orden de Compra.
    Solo se permite si la orden está en estado 'Borrador'.
    """
    return await purchasing_service.update_purchase_order(db, order_id, po_data)

@router.patch(
    "/orders/{order_id}/status",
    response_model=PurchaseOrderOut,
    summary="Actualizar el estado de una OC (ej. Confirmar, Cancelar)",
    dependencies=[Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_order_status_route(
    order_id: str,
    payload: UpdateStatusPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Permite cambiar el estado de una OC, sujeto a reglas de negocio.
    Por ejemplo, para pasar de 'Borrador' a 'Confirmado'.
    """
    return await purchasing_service.update_purchase_order_status(db, order_id, payload.new_status)

# ==============================================================================
# SECCIÓN 4: ENDPOINTS PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

@router.post(
    "/orders/{order_id}/receipts",
    response_model=GoodsReceiptOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una Recepción de Mercancía para una OC",
    dependencies=[Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WAREHOUSE]))]
)
async def register_goods_receipt(
    order_id: str,
    receipt_data: GoodsReceiptCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Crea una recepción de mercancía (Goods Receipt) vinculada a una OC.
    Esta operación afecta directamente al stock del inventario.
    """
    # El ID de la OC se pasa explícitamente desde la URL para claridad REST.
    receipt_data.purchase_order_id = order_id
    return await purchasing_service.create_goods_receipt(db, receipt_data, current_user)

@router.get(
    "/receipts",
    response_model=PaginatedGoodsReceiptsResponse,
    summary="Listar y buscar Recepciones de Mercancía paginadas"
)
async def get_all_goods_receipts(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Término para buscar por número de recepción."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de la página.")
) -> Dict[str, Any]:
    """Obtiene una lista paginada de todas las recepciones de mercancía."""
    return await purchasing_service.get_goods_receipts_paginated(db=db, search=search, page=page, page_size=page_size)

@router.get(
    "/receipts/{receipt_id}",
    response_model=GoodsReceiptOut,
    summary="Obtener una Recepción de Mercancía por su ID"
)
async def get_goods_receipt_by_id_route(
    receipt_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """Recupera los detalles completos de una recepción de mercancía específica."""
    return await purchasing_service.get_goods_receipt_by_id(db, receipt_id)

# ==============================================================================
# SECCIÓN 5: ENDPOINTS PARA FACTURAS DE COMPRA (PURCHASE BILL)
# ==============================================================================

@router.post(
    "/bills",
    response_model=PurchaseBillOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Factura de Compra",
    dependencies=[Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]))]
)
async def create_new_purchase_bill(
    bill_data: PurchaseBillCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """Crea un documento de factura (Purchase Bill), registrando una cuenta por pagar."""
    return await purchasing_service.create_purchase_bill(db, bill_data, current_user)

@router.get(
    "/bills",
    response_model=PaginatedPurchaseBillsResponse,
    summary="Listar y buscar Facturas de Compra paginadas"
)
async def get_all_purchase_bills(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Término para buscar por N° de factura o N° de factura de proveedor."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de la página.")
) -> Dict[str, Any]:
    """Obtiene una lista paginada de todas las facturas de compra."""
    return await purchasing_service.get_purchase_bills_paginated(db=db, search=search, page=page, page_size=page_size)

@router.get(
    "/bills/{bill_id}",
    response_model=PurchaseBillOut,
    summary="Obtener una Factura de Compra por su ID"
)
async def get_bill_by_id_route(
    bill_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """Recupera los detalles completos de una factura de compra específica."""
    return await purchasing_service.get_purchase_bill_by_id(db, bill_id)