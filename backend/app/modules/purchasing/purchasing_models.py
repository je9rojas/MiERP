# /backend/app/modules/purchasing/purchasing_models.py

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

# Importaciones clave de tus otros módulos para reutilizar modelos
from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut # Para embeber datos del proveedor
from app.modules.inventory.product_models import ProductOut # Para los ítems

# --- Enums para el control de estados del flujo ---

class PurchaseOrderStatus(str, Enum):
    PENDING = "pendiente"       # Creada, esperando aprobación
    APPROVED = "aprobada"       # Aprobada, se puede generar la factura
    REJECTED = "rechazada"      # Proceso cancelado
    PARTIAL = "parcialmente_recibida" # Se ha recibido parte de la mercancía
    COMPLETED = "completada"    # Toda la mercancía fue recibida

class InvoiceStatus(str, Enum):
    UNPAID = "no_pagada"
    PAID = "pagada"
    OVERDUE = "vencida"

# --- Modelos para la LÍNEA DE PRODUCTO en una Orden de Compra ---
# Similar a como lo harías en una orden de venta.

class PurchaseOrderItem(BaseModel):
    product_id: PyObjectId
    sku: str
    name: str
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    subtotal: float

# --- Modelos de la ORDEN DE COMPRA (Purchase Order) ---

class PurchaseOrderBase(BaseModel):
    supplier_id: PyObjectId
    items: List[PurchaseOrderItem]
    total_amount: float
    notes: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    pass # Usa la base para la creación

class PurchaseOrderInDB(PurchaseOrderBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    po_number: str # Se generará en el servicio
    status: PurchaseOrderStatus = PurchaseOrderStatus.PENDING
    created_by_id: PyObjectId
    approved_by_id: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseOrderOut(PurchaseOrderInDB):
    # Podrías añadir datos del proveedor y usuario para una respuesta más rica
    supplier: Optional[SupplierOut] = None 
    # created_by: UserOut (si tienes un modelo UserOut)

# --- Modelos de la FACTURA DE COMPRA (Invoice) ---

class InvoiceBase(BaseModel):
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    items: List[PurchaseOrderItem]
    total_amount: float
    due_date: datetime
    
class InvoiceInDB(InvoiceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    invoice_number: str # Se genera al crear
    status: InvoiceStatus = InvoiceStatus.UNPAID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceOut(InvoiceInDB):
    pass