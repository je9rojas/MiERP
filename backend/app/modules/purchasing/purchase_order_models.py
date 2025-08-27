# /backend/app/modules/purchasing/purchase_order_models.py

"""
Define los modelos de datos de Pydantic para la entidad Orden de Compra.

Este módulo encapsula todas las estructuras de datos, enumeraciones y configuraciones
relacionadas exclusivamente con las Órdenes de Compra (Purchase Orders), garantizando
una alta cohesión y separación de intereses.
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

class PurchaseOrderStatus(str, Enum):
    """Define los posibles estados de una Orden de Compra."""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    FULLY_RECEIVED = "fully_received"
    BILLED = "billed"
    CANCELLED = "cancelled"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA ITEMS (SUB-DOCUMENTOS)
# ==============================================================================

class PurchaseOrderItemCreate(BaseModel):
    """Modelo para la creación de un ítem dentro de una Orden de Compra."""
    product_id: PyObjectId
    quantity_ordered: int = Field(..., gt=0, description="Cantidad de producto solicitada.")
    unit_cost: float = Field(..., ge=0, description="Costo por unidad del producto.")
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class PurchaseOrderItem(PurchaseOrderItemCreate):
    """Modelo completo de un ítem, enriquecido con datos del producto."""
    sku: str
    name: str

# ==============================================================================
# SECCIÓN 4: MODELOS PRINCIPALES DE LA ORDEN DE COMPRA
# ==============================================================================

class PurchaseOrderCreate(BaseModel):
    """Modelo para la creación de una nueva Orden de Compra."""
    supplier_id: PyObjectId
    order_date: date
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = ""
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    """Modelo para la actualización de una Orden de Compra en estado borrador."""
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None

class PurchaseOrderInDB(BaseModel):
    """Modelo que representa la Orden de Compra tal como se almacena en la BD."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = ""
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    receipt_ids: List[PyObjectId] = []
    bill_ids: List[PyObjectId] = []
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseOrderOut(BaseModel):
    """Modelo de la Orden de Compra para respuestas de la API, con datos poblados."""
    id: PyObjectId = Field(..., alias="_id")
    order_number: str
    supplier: Optional[SupplierOut] = None
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = ""
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus
    created_at: datetime
    updated_at: datetime
    receipt_ids: List[PyObjectId] = []
    bill_ids: List[PyObjectId] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})