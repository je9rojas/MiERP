# backend/app/modules/purchasing/purchasing_models.py

"""
Define los modelos de datos de Pydantic para el Módulo de Compras (Purchasing).

Este módulo implementa el flujo "Procure-to-Pay" con tres entidades principales
que siguen el principio de Separación de Concerns:

1.  **Orden de Compra (Purchase Order):**
    Representa el documento de acuerdo con un proveedor sobre los productos,
    cantidades y precios. Es el documento que inicia el proceso de compra.

2.  **Recepción de Mercancía (Goods Receipt):**
    Registra el movimiento físico de entrada de productos al inventario. Este
    documento está vinculado a una Orden de Compra y confirma qué se recibió
    y en qué cantidad.

3.  **Factura de Compra (Purchase Bill):**
    Es el documento financiero que formaliza la deuda con el proveedor. Se genera
    a partir de las recepciones y sirve como base para el módulo de Cuentas por Pagar.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional, Any
from datetime import datetime, date, timezone
from enum import Enum

from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut

# ==============================================================================
# SECCIÓN 2: ENUMS PARA ESTADOS Y TIPOS
# ==============================================================================

class PurchaseOrderStatus(str, Enum):
    """Define los estados del ciclo de vida de una Orden de Compra."""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    FULLY_RECEIVED = "fully_received"
    BILLED = "billed"
    CANCELLED = "cancelled"

class PurchaseBillStatus(str, Enum):
    """Define los estados financieros de una Factura de Compra."""
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA ITEMS (Sub-documentos)
# ==============================================================================

class PurchaseOrderItemCreate(BaseModel):
    """Ítem para el payload de creación de una Orden de Compra. Contiene solo lo
    esencial que envía el cliente."""
    product_id: PyObjectId
    quantity_ordered: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class PurchaseOrderItem(PurchaseOrderItemCreate):
    """Ítem completo dentro de una Orden de Compra, enriquecido con datos del producto."""
    sku: str
    name: str

class GoodsReceiptItem(BaseModel):
    """Ítem dentro de una Recepción de Mercancía."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int
    quantity_received: int = Field(..., ge=0)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class PurchaseBillItem(BaseModel):
    """Ítem dentro de una Factura de Compra."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_billed: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    subtotal: float
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 4: MODELOS PARA LA ORDEN DE COMPRA (PURCHASE ORDER)
# ==============================================================================

class PurchaseOrderCreate(BaseModel):
    """Modelo para crear una nueva Orden de Compra."""
    supplier_id: PyObjectId
    order_date: date
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate] # Usa el modelo específico para la creación

class PurchaseOrderUpdate(BaseModel):
    """Modelo para actualizar una Orden de Compra existente."""
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None # También usa el modelo de creación

class PurchaseOrderInDB(BaseModel):
    """Modelo de la Orden de Compra tal como se almacena en la BD."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItem] # En la BD, los ítems están enriquecidos
    total_amount: float
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    receipt_ids: List[PyObjectId] = []
    bill_ids: List[PyObjectId] = []
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseOrderOut(BaseModel):
    """Modelo de la Orden de Compra para respuestas de la API."""
    id: PyObjectId
    order_number: str
    supplier: SupplierOut
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus
    created_at: datetime
    updated_at: datetime
    receipt_ids: List[PyObjectId] = []
    bill_ids: List[PyObjectId] = []

    @field_serializer('id', 'created_by_id', 'receipt_ids', 'bill_ids')
    def serialize_object_ids(self, value: Any, _info):
        if isinstance(value, list):
            return [str(item) for item in value]
        return str(value)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 5: MODELOS PARA LA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

class GoodsReceiptCreate(BaseModel):
    """Modelo para crear una nueva Recepción de Mercancía."""
    purchase_order_id: PyObjectId
    received_date: date
    notes: Optional[str] = None
    items: List[GoodsReceiptItem]

class GoodsReceiptInDB(BaseModel):
    """Modelo de la Recepción de Mercancía tal como se almacena en la BD."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    receipt_number: str
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    received_date: datetime
    notes: Optional[str] = None
    items: List[GoodsReceiptItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class GoodsReceiptOut(BaseModel):
    """Modelo de la Recepción de Mercancía para respuestas de la API."""
    id: PyObjectId
    receipt_number: str
    purchase_order_id: PyObjectId
    supplier: SupplierOut
    created_by_id: PyObjectId
    received_date: datetime
    notes: Optional[str] = None
    items: List[GoodsReceiptItem]
    created_at: datetime

    @field_serializer('id', 'purchase_order_id', 'created_by_id')
    def serialize_object_ids(self, value: PyObjectId, _info):
        return str(value)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 6: MODELOS PARA LA FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================

class PurchaseBillCreate(BaseModel):
    """Modelo para crear una nueva Factura de Compra."""
    purchase_order_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: date
    due_date: date
    notes: Optional[str] = None
    items: List[PurchaseBillItem]

class PurchaseBillInDB(BaseModel):
    """Modelo de la Factura de Compra tal como se almacena en la BD."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    bill_number: str
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = None
    items: List[PurchaseBillItem]
    total_amount: float
    paid_amount: float = 0.0
    status: PurchaseBillStatus = PurchaseBillStatus.UNPAID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseBillOut(BaseModel):
    """Modelo de la Factura de Compra para respuestas de la API."""
    id: PyObjectId
    bill_number: str
    purchase_order_id: PyObjectId
    supplier: SupplierOut
    created_by_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = None
    items: List[PurchaseBillItem]
    total_amount: float
    paid_amount: float
    status: PurchaseBillStatus
    created_at: datetime

    @field_serializer('id', 'purchase_order_id', 'created_by_id')
    def serialize_object_ids(self, value: PyObjectId, _info):
        return str(value)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True)