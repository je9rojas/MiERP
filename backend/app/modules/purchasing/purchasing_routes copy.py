# backend/app/modules/purchasing/purchasing_routes.py

"""
Define los endpoints de la API para el Módulo de Compras.

Este router expone operaciones para dos entidades principales:
1. Órdenes de Compra (Purchase Orders)
2. Recepciones/Facturas de Compra (Purchase Bills)

Aplica seguridad basada en roles y delega toda la lógica de negocio a la
capa de servicio (`purchasing_service`), manteniendo el controlador limpio
y enfocado en la gestión de la API.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, Query, status, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import purchasing_service
from .purchasing_models import (
    PurchaseOrderCreate, PurchaseOrderOut, PurchaseOrderUpdate,
    PurchaseBillCreate, PurchaseBillOut, PurchaseOrderStatus # Se añade PurchaseOrderStatus
)
from app.modules.auth.dependencies import get_current_active_user

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA/PAYLOAD
# ==============================================================================

router = APIRouter(
    prefix="/purchasing",
    tags=["Compras"]
)

class PaginatedPurchaseOrdersResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de órdenes de compra."""
    total_count: int
    items: List[PurchaseOrderOut]

class UpdateStatusPayload(BaseModel):
    """Define el cuerpo de la petición para actualizar el estado de una OC."""
    new_status: PurchaseOrderStatus

# ==============================================================================
# SECCIÓN 3: ENDPOINTS PARA ÓRDENES DE COMPRA (PURCHASE ORDERS)
# ==============================================================================

# ... (Endpoints POST /orders, GET /orders, GET /orders/{order_id} permanecen idénticos)
@router.post("/orders", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED, summary="Crear una nueva Orden de Compra")
async def create_new_purchase_order(po_data: PurchaseOrderCreate, db: AsyncIOMotorDatabase = Depends(get_db), current_user: UserOut = Depends(get_current_active_user)):
    return await purchasing_service.create_purchase_order(db, po_data, current_user)

@router.get("/orders", response_model=PaginatedPurchaseOrdersResponse, summary="Obtener lista paginada de Órdenes de Compra")
async def get_all_purchase_orders(db: AsyncIOMotorDatabase = Depends(get_db), _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE, UserRole.ACCOUNTANT])), search: Optional[str] = Query(None, description="Término de búsqueda por número de orden."), page: int = Query(1, ge=1, description="Número de página."), page_size: int = Query(10, ge=1, le=100, description="Tamaño de la página.")):
    result = await purchasing_service.get_purchase_orders_paginated(db=db, search=search, page=page, page_size=page_size)
    return result

@router.get("/orders/{order_id}", response_model=PurchaseOrderOut, summary="Obtener una Orden de Compra por ID", responses={404: {"description": "Orden de Compra no encontrada"}})
async def get_purchase_order_by_id_route(order_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _user: UserOut = Depends(get_current_active_user)):
    order = await purchasing_service.get_purchase_order_by_id(db, order_id)
    return order


@router.patch("/orders/{order_id}", response_model=PurchaseOrderOut, summary="Actualizar una Orden de Compra", responses={404: {"description": "Orden de Compra no encontrada o no editable"}})
async def update_purchase_order_route(order_id: str, order_data: PurchaseOrderUpdate, db: AsyncIOMotorDatabase = Depends(get_db), _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))):
    updated_order = await purchasing_service.update_purchase_order(db, order_id, order_data)
    return updated_order


@router.patch(
    "/orders/{order_id}/status",
    response_model=PurchaseOrderOut,
    summary="Actualizar el estado de una Orden de Compra (Aprobación/Rechazo)",
    responses={
        404: {"description": "Orden de Compra no encontrada"},
        409: {"description": "Transición de estado no válida"},
        403: {"description": "Permisos insuficientes para esta acción"}
    }
)
async def update_order_status_route(
    order_id: str,
    payload: UpdateStatusPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Permite cambiar el estado de una Orden de Compra.
    Este endpoint es utilizado para el flujo de aprobación:
    - Un usuario puede enviar a aprobación (draft -> pending_approval).
    - Un manager puede aprobar (pending_approval -> approved).
    - Un manager puede rechazar (pending_approval -> rejected).
    """
    updated_order = await purchasing_service.update_purchase_order_status(
        db, order_id, payload.new_status, current_user
    )
    return updated_order


@router.post("/orders/upload-initial-inventory", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED, summary="Importar Inventario Inicial desde CSV", description="Crea y recibe una OC a partir de un archivo CSV para la carga inicial de inventario.")
async def upload_initial_inventory_file(file: UploadFile = File(..., description="Archivo CSV con columnas: sku, quantity, cost"), db: AsyncIOMotorDatabase = Depends(get_db), current_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    return await purchasing_service.create_purchase_order_from_file(db, file, current_user)

# ==============================================================================
# SECCIÓN 4: ENDPOINTS PARA RECEPCIÓN/FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================

# ... (Endpoints POST /orders/{order_id}/register-receipt y GET /bills/{bill_id} permanecen idénticos)
@router.post("/orders/{order_id}/register-receipt", response_model=PurchaseBillOut, status_code=status.HTTP_201_CREATED, summary="Registrar Recepción y Factura de una Orden de Compra")
async def register_purchase_receipt(order_id: str, bill_data: PurchaseBillCreate, db: AsyncIOMotorDatabase = Depends(get_db), current_user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WAREHOUSE]))):
    created_bill = await purchasing_service.process_purchase_receipt(db, order_id, bill_data, current_user)
    return created_bill

@router.get("/bills/{bill_id}", response_model=PurchaseBillOut, summary="Obtener una Factura de Compra por ID", responses={404: {"description": "Factura de Compra no encontrada"}})
async def get_bill_by_id_route(bill_id: str, db: AsyncIOMotorDatabase = Depends(get_db), _user: UserOut = Depends(get_current_active_user)):
    bill = await purchasing_service.get_bill_by_id(db, bill_id)
    return bill