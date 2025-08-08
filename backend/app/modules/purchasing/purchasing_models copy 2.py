# backend/app/modules/purchasing/purchasing_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Orden de Compra' (Purchase Order).

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
    PARTIALLY_RECEIVED = "partially_received"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA LOS ÍTEMS DE LA ORDEN
# ==============================================================================

class PurchaseOrderItemCreate(BaseModel):
    """Define los datos mínimos que el cliente debe enviar para añadir un ítem a una OC."""
    product_id: PyObjectId
    quantity_ordered: int = Field(..., gt=0, description="Cantidad de unidades solicitadas del producto.")
    unit_cost: float = Field(..., ge=0, description="Costo unitario del producto al momento de crear la orden.")

class PurchaseOrderItem(BaseModel):
    """Representa un ítem completo dentro de una orden de compra, con todos los datos calculados."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int
    unit_cost: float

    # CORRECCIÓN DEFINITIVA: Usar un serializador explícito para el ID del producto.
    @field_serializer('product_id')
    def serialize_product_id(self, product_id_obj: PyObjectId, _info):
        return str(product_id_obj)

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True
    )

# ==============================================================================
# SECCIÓN 4: MODELOS PRINCIPALES DE LA ORDEN DE COMPRA (DTOS)
# ==============================================================================

class PurchaseOrderCreate(BaseModel):
    """DTO para la creación de una nueva Orden de Compra."""
    supplier_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate] = Field(..., min_length=1)

class PurchaseOrderUpdate(BaseModel):
    """DTO para actualizar una Orden de Compra existente (solo en estado 'borrador')."""
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = Field(None, min_length=1)

class PurchaseOrderInDB(BaseModel):
    """Representa el documento completo de la OC tal como se almacena en la base de datos."""
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

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str} # Aquí sí es útil para la inserción
    )

class PurchaseOrderOut(BaseModel):
    """DTO para exponer los datos de una Orden de Compra a través de la API."""
    id: str  # En la salida, el id siempre será un string.
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

    # Se usa Pydantic para validar y transformar el documento de la BD a este modelo.
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True, # Permite leer desde atributos de un objeto (como el doc de la BD)
        arbitrary_types_allowed=True,
    )