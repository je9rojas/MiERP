# /backend/app/modules/purchasing/purchase_order_routes.py
# GESTOR DE RUTAS PARA ÓRDENES DE COMPRA CON ARQUITECTURA MODULAR

from fastapi import APIRouter, Depends, Body, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- SECCIÓN 1: IMPORTACIONES ---

# Importaciones del núcleo de la aplicación y de otros módulos
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserOut, UserRole

# Importaciones relativas dentro del mismo módulo 'purchasing'
# Nota: Asumimos que has movido los schemas a un archivo _models.py
from .purchase_order_models import PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate

# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER ---

router = APIRouter(
    prefix="/purchase-orders",
    tags=["Purchasing - Purchase Orders"]
)

# Definimos los roles que tendrán acceso a la gestión de órdenes de compra
ROLES_ALLOWED_TO_MANAGE_PO = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAREHOUSE, # El rol de almacén es clave aquí
]

# --- SECCIÓN 3: MODELOS ESPECÍFICOS DEL ENDPOINT ---
# Estos son modelos que solo se usan como payload en un endpoint específico.

class ConfirmOrderPayload(BaseModel):
    supplier_invoice_code: str = Field(..., min_length=1, description="Número de factura del proveedor.")

# --- SECCIÓN 4: ENDPOINTS DE LA API (CON MARCADORES DE POSICIÓN) ---
# Cada endpoint está protegido y listo para que se le añada la lógica de servicio.

@router.post("/", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    order_data: PurchaseOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_PO))
):
    """
    Crea una nueva Orden de Compra en estado 'BORRADOR'.
    """
    # En el futuro, aquí llamarías a:
    # return await purchase_order_service.create_new_order(db, order_data)
    print(f"Payload recibido para crear OC: {order_data.model_dump_json(indent=2)}")
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Creación de Órdenes de Compra no implementada.")


@router.get("/", response_model=List[PurchaseOrder])
async def get_all_purchase_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_PO))
):
    """
    Lista todas las órdenes de compra.
    (En el futuro, implementará paginación y filtros).
    """
    # En el futuro, aquí llamarías a:
    # return await purchase_order_service.get_all(db)
    return []


@router.put("/{order_id}/confirm", response_model=PurchaseOrder)
async def confirm_purchase_order(
    order_id: str, 
    payload: ConfirmOrderPayload = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_PO))
):
    """
    Confirma una orden de compra, cambiando su estado y asignando el N° de factura del proveedor.
    """
    print(f"Confirmando orden {order_id} con factura {payload.supplier_invoice_code}")
    # Lógica futura: llamar a purchase_order_service.confirm_order(...)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Confirmación de OC no implementada.")


@router.post("/{order_id}/receive", response_model=PurchaseOrder)
async def receive_purchase_order_items(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_PO))
):
    """
    Registra la recepción de mercancía y actualiza el stock del inventario.
    """
    print(f"Recibiendo mercancía para la orden {order_id}")
    # Lógica futura: llamar a purchase_order_service.receive_items(...)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Recepción de OC no implementada.")