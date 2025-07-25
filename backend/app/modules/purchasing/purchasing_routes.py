# /backend/app/modules/purchasing/purchasing_routes.py

"""
Define los endpoints de la API para el módulo de Compras, utilizando un sistema de
control de acceso basado en roles (RBAC) para proteger cada operación.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# --- SECCIÓN 1: IMPORTACIONES DE LA APLICACIÓN ---

from app.core.database import get_db
# --- CAMBIO CLAVE: Se importa la dependencia 'role_checker' que sí existe. ---
from app.dependencies.roles import role_checker
# --- CAMBIO CLAVE: Se importa el Enum 'UserRole' para definir los permisos. ---
from app.modules.users.user_models import UserRole, UserOut
from . import purchasing_service
from .purchase_order_models import PurchaseOrderCreate, PurchaseOrderOut, InvoiceOut


# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER Y MODELOS DE RESPUESTA ---

router = APIRouter(prefix="/purchasing", tags=["Compras - Órdenes de Compra"])

class PaginatedPurchaseOrderResponse(BaseModel):
    """Modelo de respuesta para las peticiones paginadas de órdenes de compra."""
    total: int
    items: List[PurchaseOrderOut]


# --- SECCIÓN 3: DEFINICIÓN DE LISTAS DE ROLES PERMITIDOS ---
# Se definen aquí para mantener el código de los endpoints limpio y legible.
# Estas listas utilizan el Enum UserRole para evitar errores de tipeo.

ROLES_CAN_MANAGE_PO = [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]
ROLES_CAN_APPROVE_PO = [UserRole.ADMIN, UserRole.MANAGER]


# --- SECCIÓN 4: ENDPOINTS DEL CRUD DE ÓRDENES DE COMPRA ---

@router.get("/purchase-orders", response_model=PaginatedPurchaseOrderResponse)
async def get_all_purchase_orders_route(
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CAMBIO CLAVE: Se utiliza 'role_checker' con la lista de roles correspondiente. ---
    _user: UserOut = Depends(role_checker(ROLES_CAN_MANAGE_PO)),
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10,
):
    """
    Obtiene una lista paginada de órdenes de compra.
    Requiere que el rol del usuario esté en la lista ROLES_CAN_MANAGE_PO.
    """
    result = await purchasing_service.get_purchase_orders_with_filters(
        db=db, search=search, status=status, page=page, page_size=pageSize
    )
    if result is None:
        return {"total": 0, "items": []}
    return result


@router.post("/purchase-orders", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_order_route(
    po_data: PurchaseOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CAMBIO CRAVE: Se utiliza 'role_checker' para la creación. ---
    user: UserOut = Depends(role_checker(ROLES_CAN_MANAGE_PO))
):
    """
    Crea una nueva orden de compra.
    Requiere que el rol del usuario esté en la lista ROLES_CAN_MANAGE_PO.
    """
    try:
        created_po = await purchasing_service.create_purchase_order(db, po_data, user)
        return created_po
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/purchase-orders/{po_id}/approve", response_model=InvoiceOut)
async def approve_purchase_order_route(
    po_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CAMBIO CLAVE: Se utiliza 'role_checker' con la lista de roles de aprobación. ---
    user: UserOut = Depends(role_checker(ROLES_CAN_APPROVE_PO))
):
    """
    Aprueba una orden de compra pendiente y genera su factura.
    Requiere que el rol del usuario esté en la lista más restrictiva ROLES_CAN_APPROVE_PO.
    """
    try:
        invoice = await purchasing_service.approve_po_and_create_invoice(db, po_id, user)
        return invoice
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))