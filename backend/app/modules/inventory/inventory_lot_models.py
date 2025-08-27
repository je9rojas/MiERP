# /backend/app/modules/inventory/inventory_lot_models.py

"""
Define los modelos de datos de Pydantic para los Lotes y Movimientos de Inventario.

Este módulo se enfoca en las estructuras de datos transaccionales del inventario,
manteniéndolas separadas de la definición maestra del producto.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: DTO PARA MOVIMIENTOS DE STOCK
# ==============================================================================

class StockEntryItem(BaseModel):
    """
    Data Transfer Object (DTO) para registrar una entrada de stock.

    Este modelo actúa como una "interfaz" genérica para el inventory_service,
    desacoplándolo de los módulos que originan el movimiento (ej. Compras).
    Contiene toda la información necesaria para crear un nuevo lote de inventario.
    """

    product_id: PyObjectId
    sku: str
    quantity_received: int
    unit_cost: float
    received_date: datetime
    supplier_id: Optional[PyObjectId]
    purchase_order_id: Optional[PyObjectId]
    source_document_id: PyObjectId # ID del documento de origen (ej. GoodsReceipt ID)
    source_document_number: str   # Número del documento (ej. "RM-2025-0001")

# ==============================================================================
# SECCIÓN 3: MODELOS DE LOTE DE INVENTARIO
# ==============================================================================

class InventoryLotInDB(BaseModel):
    """Modelo que representa un Lote de Inventario como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    product_id: PyObjectId
    purchase_order_id: Optional[PyObjectId] = None
    goods_receipt_id: Optional[PyObjectId] = None
    supplier_id: Optional[PyObjectId] = None
    warehouse_id: Optional[PyObjectId] = None # Para futura expansión
    lot_number: str
    received_on: datetime
    acquisition_cost: float
    initial_quantity: int
    current_quantity: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class InventoryLotOut(BaseModel):
    """DTO de Salida para exponer la información de un Lote de Inventario."""
    id: PyObjectId = Field(..., alias="_id")
    product_id: PyObjectId
    product_sku: Optional[str] = None  # Enriquecido en el servicio
    product_name: Optional[str] = None # Enriquecido en el servicio
    lot_number: str
    received_on: datetime
    acquisition_cost: float
    initial_quantity: int
    current_quantity: int
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})