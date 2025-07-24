# /backend/app/modules/purchasing/purchasing_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# --- Dependencias y Modelos de la Aplicación ---
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import purchasing_service
from .purchase_order_models import PurchaseOrderCreate, PurchaseOrderOut, InvoiceOut

# --- Definición del Router ---
# El prefijo del módulo se establece aquí.
# La ruta final del endpoint de lista será: /api (de main.py) + /purchasing (de aquí) + /purchase-orders (del endpoint)
router = APIRouter(prefix="/purchasing", tags=["Compras - Órdenes de Compra"])


# --- Modelos de Respuestaa Específicos para este Router ---
class PaginatedPurchaseOrderResponse(BaseModel):
    total: int
    items: List[PurchaseOrderOut]


# --- Definiciones de Roles para Claridad ---
ROLES_CAN_MANAGE_PO = [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]
ROLES_CAN_APPROVE_PO = [UserRole.ADMIN, UserRole.MANAGER]


# --- Endpoints del CRUD de Órdenes de Compra ---

# --- ¡CORRECCIÓN CRÍTICA! ENDPOINT GET AÑADIDO ---
# Este es el endpoint que faltaba y que causaba el error 404 Not Found.
@router.get("/purchase-orders", response_model=PaginatedPurchaseOrderResponse)
async def get_all_purchase_orders_route(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_CAN_MANAGE_PO)),
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10,
):
    """
    Obtiene una lista paginada y filtrada de todas las órdenes de compra.
    """
    # Nota: Debes asegurarte de que la función 'get_purchase_orders_with_filters'
    # exista en tu archivo 'purchasing_service.py'.
    result = await purchasing_service.get_purchase_orders_with_filters(
        db=db, search=search, status=status, page=page, page_size=pageSize
    )
    # Si el servicio no encuentra nada, devuelve una respuesta vacía en lugar de un error.
    if result is None:
        return {"total": 0, "items": []}
    return result


@router.post("/purchase-orders", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_order_route(
    po_data: PurchaseOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserOut = Depends(role_checker(ROLES_CAN_MANAGE_PO))
):
    """
    Crea una nueva orden de compra en el sistema.
    """
    try:
        # Nota: Debes asegurarte de que la función 'create_purchase_order'
        # exista en tu archivo 'purchasing_service.py'.
        created_po = await purchasing_service.create_purchase_order(db, po_data, user)
        return created_po
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/purchase-orders/{po_id}/approve", response_model=InvoiceOut)
async def approve_purchase_order_route(
    po_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserOut = Depends(role_checker(ROLES_CAN_APPROVE_PO))
):
    """
    Aprueba una orden de compra pendiente y genera la factura de compra correspondiente.
    """
    try:
        # Nota: Debes asegurarte de que la función 'approve_po_and_create_invoice'
        # exista en tu archivo 'purchasing_service.py'.
        invoice = await purchasing_service.approve_po_and_create_invoice(db, po_id, user)
        return invoice
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))