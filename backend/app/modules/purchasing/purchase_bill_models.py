# /backend/app/modules/purchasing/purchase_bill_models.py

"""
Define los modelos de datos de Pydantic para la entidad Factura de Compra.

Este módulo encapsula todas las estructuras de datos, enumeraciones y configuraciones
relacionadas con las Facturas de Compra (Purchase Bills), aislando el dominio
financiero del módulo de compras.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from datetime import datetime, date, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut

# ==============================================================================
# SECCIÓN 2: ENUMERACIONES ESPECÍFICAS
# ==============================================================================

class PurchaseBillStatus(str, Enum):
    """Define los posibles estados de una Factura de Compra."""
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA ITEMS (SUB-DOCUMENTOS)
# ==============================================================================

class PurchaseBillItem(BaseModel):
    """Modelo para un ítem dentro de una Factura de Compra."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_billed: int = Field(..., gt=0, description="Cantidad de producto que se factura.")
    unit_cost: float = Field(..., ge=0, description="Costo unitario facturado.")
    subtotal: float
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 4: MODELOS PRINCIPALES DE LA FACTURA DE COMPRA
# ==============================================================================

class PurchaseBillCreate(BaseModel):
    """Modelo para la creación de una nueva Factura de Compra."""
    purchase_order_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: date
    due_date: date
    notes: Optional[str] = ""
    items: List[PurchaseBillItem]

class PurchaseBillInDB(BaseModel):
    """Modelo que representa la Factura tal como se almacena en la BD."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    bill_number: str
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = ""
    items: List[PurchaseBillItem]
    total_amount: float
    paid_amount: float = 0.0
    status: PurchaseBillStatus = PurchaseBillStatus.UNPAID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseBillOut(BaseModel):
    """Modelo de la Factura para respuestas de la API, con datos poblados."""
    id: PyObjectId = Field(..., alias="_id")
    bill_number: str
    purchase_order_id: PyObjectId
    supplier: Optional[SupplierOut] = None
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = ""
    items: List[PurchaseBillItem]
    total_amount: float
    paid_amount: float
    status: PurchaseBillStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})