# /backend/app/modules/purchasing/purchasing_routes.py
# RUTAS REFACTORIZADAS PARA USAR EL PERMISSION CHECKER

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# --- Dependencias y Modelos de la Aplicación ---
from app.core.database import get_db
# --- CAMBIO CRÍTICO: Importamos la nueva dependencia y las constantes ---
from app.dependencies.roles import permission_checker
from app.constants import permissions
from app.modules.users.user_models import UserOut
from . import purchasing_service
from .purchase_order_models import PurchaseOrderCreate, PurchaseOrderOut, InvoiceOut

router = APIRouter(prefix="/purchasing", tags=["Compras - Órdenes de Compra"])

class PaginatedPurchaseOrderResponse(BaseModel):
    total: int
    items: List[PurchaseOrderOut]

# --- Endpoints del CRUD de Órdenes de Compra (REFACTORIZADOS) ---

@router.get("/purchase-orders", response_model=PaginatedPurchaseOrderResponse)
async def get_all_purchase_orders_route(
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CAMBIO CRÍTICO: Usamos el permission_checker ---
    _user: UserOut = Depends(permission_checker([permissions.PURCHASE_ORDER_VIEW])),
    search: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10,
):
    """ Obtiene una lista paginada de órdenes de compra. Requiere permiso de vista. """
    result = await purchasing_service.get_purchase_orders_with_filters(
        db=db, search=search, page=page, page_size=pageSize
    )
    if result is None:
        return {"total": 0, "items": []}
    return result


@router.post("/purchase-orders", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_order_route(
    po_data: PurchaseOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CAMBIO CRÍTICO: Usamos el permission_checker ---
    user: UserOut = Depends(permission_checker([permissions.PURCHASE_ORDER_CREATE]))
):
    """ Crea una nueva orden de compra. Requiere permiso de creación. """
    try:
        created_po = await purchasing_service.create_purchase_order(db, po_data, user)
        return created_po
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/purchase-orders/{po_id}/approve", response_model=InvoiceOut)
async def approve_purchase_order_route(
    po_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CAMBIO CRÍTICO: Usamos el permission_checker ---
    user: UserOut = Depends(permission_checker([permissions.PURCHASE_ORDER_APPROVE]))
):
    """ Aprueba una orden de compra. Requiere permiso de aprobación. """
    try:
        invoice = await purchasing_service.approve_po_and_create_invoice(db, po_id, user)
        return invoice
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))