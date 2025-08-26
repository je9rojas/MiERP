# /backend/app/modules/sales/sales_models.py

"""
Define los modelos de datos de Pydantic para el Módulo de Ventas.

Este módulo contiene los modelos para tres entidades principales del flujo "Order-to-Cash":
1.  Orden de Venta (SalesOrder): El acuerdo inicial con el cliente.
2.  Despacho (Shipment): El registro del movimiento físico de mercancía fuera del almacén.
3.  Factura de Venta (SalesInvoice): El documento financiero para el cobro al cliente.

La arquitectura DTO (Data Transfer Object) separa las responsabilidades y asegura
un flujo de datos seguro y predecible.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, date
from enum import Enum

from app.models.shared import PyObjectId
from app.modules.crm.customer_models import CustomerOut
from app.modules.users.user_models import UserOut

# ==============================================================================
# SECCIÓN 2: ENUMS PARA ESTADOS
# ==============================================================================

class SalesOrderStatus(str, Enum):
    """Define los posibles estados de una Orden de Venta a lo largo de su ciclo de vida."""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PARTIALLY_SHIPPED = "partially_shipped"
    SHIPPED = "shipped"
    INVOICED = "invoiced"
    CANCELLED = "cancelled"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA LA ORDEN DE VENTA (SALES ORDER)
# ==============================================================================

class SalesOrderItemCreate(BaseModel):
    """DTO para añadir un ítem al crear una Orden de Venta."""
    product_id: PyObjectId
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class SalesOrderItem(BaseModel):
    """Representa un ítem completo dentro de una Orden de Venta."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity: int
    unit_price: float
    subtotal: float
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class SalesOrderCreate(BaseModel):
    """DTO para la creación de una nueva Orden de Venta."""
    customer_id: PyObjectId
    order_date: date = Field(default_factory=date.today)
    notes: Optional[str] = ""
    shipping_address: Optional[str] = ""
    items: List[SalesOrderItemCreate] = Field(..., min_length=1)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class SalesOrderInDB(BaseModel):
    """Representa el documento completo de la OV en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str
    customer_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    notes: Optional[str] = ""
    shipping_address: Optional[str] = ""
    items: List[SalesOrderItem]
    total_amount: float
    status: SalesOrderStatus = SalesOrderStatus.DRAFT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    shipment_ids: List[PyObjectId] = []
    invoice_ids: List[PyObjectId] = []
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class SalesOrderOut(BaseModel):
    """DTO para exponer los datos de una Orden de Venta a través de la API."""
    id: PyObjectId = Field(alias="_id")
    order_number: str
    # --- CORRECCIÓN ---
    customer: Optional[CustomerOut] = None
    customer_id: PyObjectId
    created_by: Optional[UserOut] = None
    order_date: datetime
    notes: Optional[str] = ""
    shipping_address: Optional[str] = ""
    items: List[SalesOrderItem]
    total_amount: float
    status: SalesOrderStatus
    created_at: datetime
    updated_at: datetime
    shipment_ids: List[PyObjectId] = []
    invoice_ids: List[PyObjectId] = []
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

# ==============================================================================
# SECCIÓN 4: MODELOS PARA EL DESPACHO (SHIPMENT)
# ==============================================================================

class ShipmentItem(BaseModel):
    """Representa un ítem dentro de un despacho."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int
    quantity_shipped: int = Field(..., gt=0)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class ShipmentCreate(BaseModel):
    """DTO para crear un nuevo Despacho a partir de una Orden de Venta."""
    shipping_date: date = Field(default_factory=date.today)
    notes: Optional[str] = ""
    items: List[ShipmentItem] = Field(..., min_length=1)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class ShipmentInDB(BaseModel):
    """Representa el documento completo del Despacho en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    shipment_number: str
    sales_order_id: PyObjectId
    customer_id: PyObjectId
    created_by_id: PyObjectId
    shipping_date: datetime
    notes: Optional[str] = ""
    items: List[ShipmentItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class ShipmentOut(BaseModel):
    """DTO para exponer los datos de un Despacho a través de la API."""
    id: PyObjectId = Field(alias="_id")
    shipment_number: str
    sales_order_id: PyObjectId
    # --- CORRECCIÓN ---
    customer: Optional[CustomerOut] = None
    customer_id: PyObjectId
    created_by: Optional[UserOut] = None
    shipping_date: datetime
    notes: Optional[str] = ""
    items: List[ShipmentItem]
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

# ==============================================================================
# SECCIÓN 5: MODELOS PARA LA FACTURA DE VENTA (SALES INVOICE)
# ==============================================================================

class SalesInvoiceItem(BaseModel):
    """Representa un ítem dentro de una Factura de Venta."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity: int
    unit_price: float
    subtotal: float
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class SalesInvoiceCreate(BaseModel):
    """DTO para crear una nueva Factura de Venta."""
    invoice_date: date = Field(default_factory=date.today)
    due_date: date
    notes: Optional[str] = ""
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class SalesInvoiceInDB(BaseModel):
    """Representa el documento completo de la Factura de Venta en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    invoice_number: str
    sales_order_id: PyObjectId
    customer_id: PyObjectId
    created_by_id: PyObjectId
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = ""
    items: List[SalesInvoiceItem]
    total_amount: float
    status: str = "unpaid"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class SalesInvoiceOut(BaseModel):
    """DTO para exponer los datos de una Factura de Venta a través de la API."""
    id: PyObjectId = Field(alias="_id")
    invoice_number: str
    sales_order_id: PyObjectId
    # --- CORRECCIÓN ---
    customer: Optional[CustomerOut] = None
    customer_id: PyObjectId
    created_by: Optional[UserOut] = None
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = ""
    items: List[SalesInvoiceItem]
    total_amount: float
    status: str
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})