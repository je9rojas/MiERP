# /backend/app/schemas/purchase_order.py
# CÓDIGO NUEVO Y COMPLETO - LISTO PARA COPIAR Y PEGAR

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
import enum

# --- Enum de Estados: Este es compartido por modelos y esquemas, así que puede vivir aquí ---
class PurchaseOrderStatus(str, enum.Enum):
    BORRADOR = "BORRADOR"
    CONFIRMADA = "CONFIRMADA"
    RECIBIDA_PARCIAL = "RECIBIDA_PARCIAL"
    RECIBIDA_TOTAL = "RECIBIDA_TOTAL"
    CANCELADA = "CANCELADA"

# --- Esquemas para los ítems de la orden ---
class PurchaseOrderItemBase(BaseModel):
    product_code: str = Field(..., description="El código principal del producto comprado")
    description: str = Field(..., description="Descripción del producto")
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItem(PurchaseOrderItemBase):
    # Podría tener campos adicionales al leer de la BD
    pass

# --- Esquemas para la Orden de Compra ---

# Base: Campos comunes a la creación y lectura
class PurchaseOrderBase(BaseModel):
    supplier_code: str
    purchase_date: date
    issue_date: date
    due_date: date
    payment_method: str
    tax_percentage: float
    other_charges: float = 0.0
    items: List[PurchaseOrderItemCreate]

# Esquema para crear una OC (lo que el frontend envía en POST)
class PurchaseOrderCreate(PurchaseOrderBase):
    supplier_invoice_code: Optional[str] = None
    registered_by_user_id: str

# Esquema para actualizar (lo que el frontend envía en PUT/PATCH)
class PurchaseOrderUpdate(BaseModel):
    supplier_invoice_code: Optional[str] = None
    # Añade aquí otros campos que se puedan editar en el futuro
    
# Esquema para leer desde la BD (lo que la API envía al frontend)
class PurchaseOrder(PurchaseOrderBase):
    id: str
    order_number: str
    status: PurchaseOrderStatus
    system_entry_date: datetime
    subtotal: float
    tax_amount: float
    total_amount: float
    registered_by_user_id: str
    supplier_invoice_code: Optional[str] = None
    
    # Re-definimos 'items' para usar el esquema de lectura
    items: List[PurchaseOrderItem]

    class Config:
        # --- CAMBIO: Actualizar a la sintaxis de Pydantic V2 ---
        from_attributes = True 
        validate_by_name = True