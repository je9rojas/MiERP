# /backend/app/models/purchase_order.py
# CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
import enum

# --- NUEVO: Enum para los estados, la forma profesional y segura ---
class PurchaseOrderStatus(str, enum.Enum):
    BORRADOR = "BORRADOR"
    CONFIRMADA = "CONFIRMADA"
    RECIBIDA_PARCIAL = "RECIBIDA_PARCIAL"
    RECIBIDA_TOTAL = "RECIBIDA_TOTAL"
    CANCELADA = "CANCELADA"

class PurchaseOrderItemBase(BaseModel):
    product_code: str = Field(..., description="El código principal del producto comprado")
    description: str = Field(..., description="Descripción del producto (se puede autocompletar)")
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)

class PurchaseOrderBase(BaseModel):
    supplier_code: str = Field(..., description="Código del proveedor en nuestro sistema")
    # --- CAMBIO CLAVE: La factura del proveedor es opcional al crear ---
    supplier_invoice_code: Optional[str] = Field(None, description="Código de la factura del proveedor (opcional al inicio)")
    
    purchase_date: date = Field(..., description="Fecha de la compra (del documento)")
    issue_date: date = Field(..., description="Fecha de emisión de la OC")
    due_date: date = Field(..., description="Fecha de vencimiento para el pago")
    payment_method: str = Field(...)
    items: List[PurchaseOrderItemBase] = Field(...)
    tax_percentage: float = Field(..., description="Porcentaje de impuesto, ej: 18.0")
    other_charges: float = Field(default=0.0)
    registered_by_user_id: str = Field(..., description="ID del usuario que registró la compra")

# Esquema para crear una nueva OC (lo que viene del frontend)
class PurchaseOrderCreate(PurchaseOrderBase):
    pass

# Esquema para actualizar una OC (ej: al confirmar)
class PurchaseOrderUpdate(BaseModel):
    supplier_invoice_code: Optional[str] = None
    # ... otros campos que se puedan editar

# Esquema completo para leer una OC desde la BD (lo que se envía al frontend)
class PurchaseOrderInDB(PurchaseOrderBase):
    id: str = Field(..., alias="_id")
    order_number: str = Field(..., description="Número de orden de compra interno (autogenerado)")
    system_entry_date: datetime = Field(default_factory=datetime.utcnow)
    status: PurchaseOrderStatus = Field(default=PurchaseOrderStatus.BORRADOR)
    subtotal: float
    tax_amount: float
    total_amount: float
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True