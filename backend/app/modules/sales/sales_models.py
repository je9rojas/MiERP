# /backend/app/modules/sales/sales_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Orden de Venta' (Sales Order).

Este módulo sigue una arquitectura DTO (Data Transfer Object) rigurosa para separar
las responsabilidades y asegurar un flujo de datos seguro y predecible entre el
cliente, la lógica de negocio y la base de datos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

from app.models.shared import PyObjectId
from app.modules.crm.customer_models import CustomerOut # Asumiendo que tendrás un CustomerOut

# ==============================================================================
# SECCIÓN 2: ENUMS Y MODELOS DE SOPORTE
# ==============================================================================

class SalesOrderStatus(str, Enum):
    """Define los posibles estados de una Orden de Venta."""
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# --- Modelo de Entrada para un Ítem de Venta ---
class SalesOrderItemCreate(BaseModel):
    """Define los datos mínimos que el cliente debe enviar para añadir un ítem a una venta."""
    product_id: PyObjectId
    quantity: int = Field(..., gt=0, description="Cantidad de unidades vendidas del producto.")

# --- Modelo Completo para un Ítem de Venta ---
class SalesOrderItem(BaseModel):
    """Representa un ítem completo dentro de una orden de venta, con todos los datos calculados."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity: int
    unit_price: float # El precio se "congela" en el momento de la venta
    subtotal: float

    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# SECCIÓN 3: MODELOS PRINCIPALES DE LA ORDEN DE VENTA (DTOS)
# ==============================================================================

class SalesOrderBase(BaseModel):
    """Modelo base con los campos comunes de una orden de venta."""
    customer_id: PyObjectId
    order_date: datetime
    notes: Optional[str] = None
    shipping_address: Optional[str] = None

# --- Modelo de Entrada (Lo que el frontend envía para crear) ---
class SalesOrderCreate(SalesOrderBase):
    """DTO para la creación de una nueva Orden de Venta."""
    items: List[SalesOrderItemCreate] = Field(..., min_length=1)

# --- Modelo de Base de Datos (La estructura completa en MongoDB) ---
class SalesOrderInDB(SalesOrderBase):
    """Representa el documento completo de la OV tal como se almacena en la base de datos."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str # Se genera en la capa de servicio
    created_by_id: PyObjectId
    items: List[SalesOrderItem]
    total_amount: float # Se calcula en la capa de servicio
    status: SalesOrderStatus = SalesOrderStatus.PENDING_PAYMENT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

# --- Modelo de Salida (Lo que la API devuelve al frontend) ---
class SalesOrderOut(BaseModel):
    """DTO para exponer los datos de una Orden de Venta a través de la API."""
    id: PyObjectId = Field(alias="_id")
    order_number: str
    customer: CustomerOut # Embebe los datos del cliente
    order_date: datetime
    notes: Optional[str] = None
    shipping_address: Optional[str] = None
    items: List[SalesOrderItem]
    total_amount: float
    status: SalesOrderStatus
    created_at: datetime
    updated_at: datetime

    @field_serializer('id')
    def serialize_id(self, id_obj: PyObjectId, _info):
        return str(id_obj)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, from_attributes=True)