# /backend/app/modules/inventory/inventory_models.py

"""
Define los modelos de datos de Pydantic para las entidades transaccionales
del inventario, como los Lotes de Inventario.

Un Lote de Inventario representa una partida específica de un producto que ha
ingresado al almacén, con su propio costo, cantidad y datos de trazabilidad.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId as BsonObjectId

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: ENUMS Y MODELOS DE SOPORTE
# ==============================================================================

class LotStatus(str, Enum):
    """Define los posibles estados de un lote de inventario."""
    AVAILABLE = "available"      # Disponible para la venta
    QUARANTINE = "quarantine"    # En revisión, no disponible
    EXPIRED = "expired"          # Vencido, no disponible
    DEPLETED = "depleted"        # Stock agotado (current_quantity = 0)

# ==============================================================================
# SECCIÓN 3: ARQUITECTURA DE MODELOS DE LOTE DE INVENTARIO
# ==============================================================================

class InventoryLotBase(BaseModel):
    """
    Modelo base con la información fundamental de un lote de inventario.
    """
    product_id: PyObjectId = Field(..., description="ID del producto maestro al que pertenece este lote.")
    warehouse_id: PyObjectId = Field(..., description="ID del almacén donde se encuentra físicamente este lote.")
    
    # --- Datos de Trazabilidad ---
    lot_number: str = Field(..., description="Número de lote único para esta partida específica.")
    country_of_origin: Optional[str] = Field(None, description="País de origen de los productos en este lote.")
    supplier_id: Optional[PyObjectId] = Field(None, description="ID del proveedor que suministró este lote.")
    purchase_order_id: Optional[PyObjectId] = Field(None, description="ID de la orden de compra asociada.")
    
    # --- Fechas ---
    received_on: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Fecha y hora de recepción del lote.")
    expiry_date: Optional[datetime] = Field(None, description="Fecha de vencimiento del lote, si aplica.")
    
    # --- Datos Contables y de Stock ---
    acquisition_cost: float = Field(..., ge=0, description="Costo de adquisición unitario REAL para este lote específico.")
    initial_quantity: int = Field(..., gt=0, description="Cantidad de unidades que ingresaron originalmente en este lote.")
    current_quantity: int = Field(..., ge=0, description="Cantidad de unidades que quedan actualmente en este lote.")

class InventoryLotInDB(InventoryLotBase):
    """Representa el documento completo del lote como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: LotStatus = Field(LotStatus.AVAILABLE, description="Estado actual del lote.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class InventoryLotOut(InventoryLotBase):
    """DTO de Salida para exponer la información de un lote de inventario."""
    id: PyObjectId = Field(..., alias="_id")
    status: LotStatus
    created_at: datetime
    updated_at: datetime
    
    # --- Campos "Populados" (Enriquecidos) ---
    # Estos campos se añadirán en la capa de servicio para dar más contexto al frontend.
    product_sku: Optional[str] = None
    product_name: Optional[str] = None
    supplier_name: Optional[str] = None
    warehouse_name: Optional[str] = None

    @field_serializer('id', 'product_id', 'warehouse_id', 'supplier_id', 'purchase_order_id', when_used='json')
    def serialize_ids(self, id_obj: BsonObjectId) -> str:
        """Convierte todos los campos ObjectId a string durante la serialización a JSON."""
        return str(id_obj)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, from_attributes=True)