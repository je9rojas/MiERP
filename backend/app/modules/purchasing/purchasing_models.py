# backend/app/modules/purchasing/purchasing_models.py

"""
Define los modelos de datos de Pydantic para el Módulo de Compras.

Este módulo contiene los modelos para dos entidades principales:
1.  **Orden de Compra (PurchaseOrder):** Representa la solicitud inicial de productos a un proveedor.
2.  **Recepción/Factura de Compra (PurchaseBill):** Representa la recepción física y la
    factura real de los productos, registrando cantidades y costos reales.

Se sigue una arquitectura DTO (Data Transfer Object) rigurosa para separar
responsabilidades y asegurar un flujo de datos seguro y predecible.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_serializer, validator
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut

# ==============================================================================
# SECCIÓN 2: ENUMS PARA ESTADOS Y TIPOS
# ==============================================================================

class PurchaseOrderStatus(str, Enum):
    """Define los posibles estados de una Orden de Compra."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PARTIALLY_RECEIVED = "partially_received"  # Estado Nuevo
    COMPLETED = "completed"                  # Ahora significa 'Totalmente Recibido'
    CANCELLED = "cancelled"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA LA ORDEN DE COMPRA (PURCHASE ORDER)
# ==============================================================================

# ------------------- SUB-MODELOS DE ÍTEMS (PURCHASE ORDER) --------------------

class PurchaseOrderItemCreate(BaseModel):
    """Define los datos mínimos para añadir un ítem a una OC al crearla."""
    product_id: PyObjectId
    quantity_ordered: int = Field(..., gt=0, description="Cantidad de unidades solicitadas del producto.")
    unit_cost: float = Field(..., ge=0, description="Costo unitario esperado del producto.")

class PurchaseOrderItem(BaseModel):
    """Representa un ítem completo dentro de una orden de compra."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int
    unit_cost: float

    @field_serializer('product_id')
    def serialize_product_id(self, product_id_obj: PyObjectId, _info):
        return str(product_id_obj)

    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

# ------------------- MODELOS PRINCIPALES DTO (PURCHASE ORDER) -----------------

class PurchaseOrderCreate(BaseModel):
    """DTO para la creación de una nueva Orden de Compra."""
    supplier_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate] = Field(..., min_length=1)

class PurchaseOrderUpdate(BaseModel):
    """DTO para actualizar una Orden de Compra (solo en estado 'draft')."""
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = Field(None, min_length=1)

class PurchaseOrderInDB(BaseModel):
    """Representa el documento completo de la OC tal como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    related_bill_ids: List[PyObjectId] = [] # Campo nuevo para trazar facturas

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseOrderOut(BaseModel):
    """DTO para exponer los datos de una Orden de Compra a través de la API."""
    id: PyObjectId = Field(..., alias="_id")
    order_number: str
    supplier: SupplierOut
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus
    created_at: datetime
    updated_at: datetime
    related_bill_ids: List[PyObjectId] = []

    @field_serializer('id', 'related_bill_ids')
    def serialize_object_ids(self, ids, _info):
        if isinstance(ids, list):
            return [str(id_obj) for id_obj in ids]
        return str(ids)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 4: MODELOS PARA LA RECEPCIÓN/FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================

# ------------------- SUB-MODELOS DE ÍTEMS (PURCHASE BILL) ---------------------

class PurchaseBillItem(BaseModel):
    """Representa un ítem dentro de una factura de compra, con cantidades y costos reales."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int = Field(..., description="Cantidad que se pidió originalmente en la OC.")
    quantity_received: int = Field(..., ge=0, description="Cantidad que se está recibiendo físicamente.")
    unit_cost: float = Field(..., ge=0, description="Costo unitario real facturado por el proveedor.")

    @field_serializer('product_id')
    def serialize_product_id(self, product_id_obj: PyObjectId, _info):
        return str(product_id_obj)

    @validator('quantity_received')
    def received_cannot_be_more_than_ordered(cls, v, values):
        if 'quantity_ordered' in values and v > values['quantity_ordered']:
            # Esta validación puede ser flexible. Algunas empresas permiten sobrerecepción.
            # Por ahora, seremos estrictos.
            raise ValueError('La cantidad recibida no puede ser mayor que la cantidad ordenada.')
        return v
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

# ----------------- MODELOS PRINCIPALES DTO (PURCHASE BILL) ------------------

class PurchaseBillCreate(BaseModel):
    """DTO para la creación de una nueva Factura de Compra, desde el frontend."""
    supplier_invoice_number: str = Field(..., description="Número de factura del proveedor.")
    received_date: datetime
    notes: Optional[str] = None
    items: List[PurchaseBillItem] = Field(..., min_length=1)

class PurchaseBillInDB(BaseModel):
    """Representa el documento completo de la Factura de Compra en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    bill_number: str # Número de documento interno
    supplier_invoice_number: str
    received_date: datetime
    notes: Optional[str] = None
    items: List[PurchaseBillItem]
    total_amount: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseBillOut(BaseModel):
    """DTO para exponer los datos de una Factura de Compra a través de la API."""
    id: PyObjectId = Field(..., alias="_id")
    purchase_order_id: PyObjectId
    bill_number: str
    supplier_invoice_number: str
    supplier: SupplierOut
    received_date: datetime
    notes: Optional[str] = None
    items: List[PurchaseBillItem]
    total_amount: float
    created_at: datetime

    @field_serializer('id', 'purchase_order_id')
    def serialize_ids(self, id_obj: PyObjectId, _info):
        return str(id_obj)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True)