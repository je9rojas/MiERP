# /backend/app/modules/purchasing/purchase_order_models.py

"""
Define los modelos de datos de Pydantic para el flujo de Órdenes de Compra y sus Facturas asociadas.
Esta arquitectura separa las responsabilidades de los modelos para la creación de datos (DTOs de entrada),
el almacenamiento en la base de datos (la fuente de la verdad) y la exposición a través de la API (DTOs de salida).
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

from app.models.shared import PyObjectId


# --- SECCIÓN 1: Enumeraciones (Enums) para Estados Controlados ---

class PurchaseOrderStatus(str, Enum):
    """
    Define los estados válidos y controlados para una Orden de Compra.
    El uso de Enums previene errores de tipeo y asegura la integridad de los datos de estado.
    """
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PARTIALLY_RECEIVED = "partially_received"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class InvoiceStatus(str, Enum):
    """Define los estados válidos y controlados para una Factura de Compra."""
    PENDING = "pending"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


# --- SECCIÓN 2: Modelos de Soporte para Ítems de la Orden ---

class PurchaseOrderItem(BaseModel):
    """
    Representa una única línea de producto dentro de una orden o factura.
    Este modelo es enriquecido por el servicio antes de guardarse en la base de datos.
    """
    product_id: PyObjectId
    product_sku: str
    product_name: str
    quantity: int = Field(..., gt=0, description="Cantidad de unidades compradas.")
    unit_cost: float = Field(..., ge=0, description="Costo por unidad del producto.")
    subtotal: float = Field(..., ge=0, description="Costo total para esta línea (cantidad * costo unitario).")

class PurchaseOrderItemCreate(BaseModel):
    """DTO de entrada para un ítem, enviado desde el frontend."""
    product_id: str = Field(..., description="El ID del producto a comprar.")
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)


# --- SECCIÓN 3: Modelos para la Orden de Compra (Purchase Order) ---

class PurchaseOrderBase(BaseModel):
    """Modelo con los campos base compartidos entre los modelos de creación y de base de datos."""
    supplier_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItem]
    subtotal: float
    tax_amount: float
    total_amount: float

class PurchaseOrderCreate(BaseModel):
    """DTO de entrada para crear una nueva Orden de Compra."""
    supplier_id: str = Field(..., description="El ID del proveedor.")
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate] = Field(..., min_length=1)

class PurchaseOrderUpdate(BaseModel):
    """DTO de entrada para actualizar una Orden de Compra. Todos los campos son opcionales."""
    order_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[PurchaseOrderStatus] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None

class PurchaseOrderInDB(PurchaseOrderBase):
    """Representa el documento completo de la Orden de Compra como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str = Field(..., description="Número único de la orden, generado por el sistema.")
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    supplier_name: str = Field(..., description="Nombre desnormalizado del proveedor para consultas rápidas.")
    created_by_id: PyObjectId
    approved_by_id: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = { PyObjectId: str, datetime: lambda dt: dt.isoformat() }

class PurchaseOrderOut(PurchaseOrderInDB):
    """
    Define la estructura de datos que la API devuelve al cliente.
    Es el modelo más completo, ideal para respuestas detalladas.
    """
    pass


# --- SECCIÓN 4: Modelos para la Factura de Compra (Purchase Invoice) ---

class PurchaseInvoiceBase(BaseModel):
    """Modelo base para la factura de compra."""
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    invoice_number: str = Field(..., description="Número de factura proporcionado por el proveedor.")
    issue_date: datetime
    due_date: datetime
    items: List[PurchaseOrderItem]
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None

class PurchaseInvoiceCreate(BaseModel):
    """DTO de entrada para registrar una nueva Factura de Compra, usualmente desde una OC aprobada."""
    purchase_order_id: str
    invoice_number: str
    issue_date: datetime
    due_date: datetime
    notes: Optional[str] = None

class PurchaseInvoiceInDB(PurchaseInvoiceBase):
    """Representa el documento completo de la Factura de Compra en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: InvoiceStatus = InvoiceStatus.PENDING
    supplier_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = { PyObjectId: str, datetime: lambda dt: dt.isoformat() }

class PurchaseInvoiceOut(PurchaseInvoiceInDB):
    """Modelo de salida para la API de Facturas de Compra."""
    pass


# --- SECCIÓN 5: ALIASES PARA COMPATIBILIDAD EXTERNA ---
# Se crean alias para simplificar las importaciones en otros módulos (rutas, servicios),
# resolviendo el error 'ImportError: cannot import name InvoiceOut'.

InvoiceOut = PurchaseInvoiceOut