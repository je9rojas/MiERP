# /backend/app/modules/purchasing/goods_receipt_models.py

"""
Define los modelos de datos de Pydantic para la entidad Recepción de Mercancía.

Este módulo contiene todas las estructuras de datos relacionadas con las
Recepciones de Mercancía (Goods Receipts), asegurando la cohesión del dominio.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from datetime import datetime, date, timezone
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut

# ==============================================================================
# SECCIÓN 2: MODELOS PARA ITEMS (SUB-DOCUMENTOS)
# ==============================================================================

class GoodsReceiptItem(BaseModel):
    """Modelo para un ítem dentro de una Recepción de Mercancía."""
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int = Field(..., gt=0, description="Cantidad originalmente pedida.")
    quantity_received: int = Field(..., ge=0, description="Cantidad físicamente recibida.")
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 3: MODELOS PRINCIPALES DE LA RECEPCIÓN DE MERCANCÍA
# ==============================================================================

class GoodsReceiptCreate(BaseModel):
    """Modelo para registrar una nueva Recepción de Mercancía."""
    purchase_order_id: PyObjectId
    received_date: date
    notes: Optional[str] = ""
    items: List[GoodsReceiptItem]

class GoodsReceiptInDB(BaseModel):
    """Modelo que representa la Recepción tal como se almacena en la BD."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    receipt_number: str
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    received_date: datetime
    notes: Optional[str] = ""
    items: List[GoodsReceiptItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class GoodsReceiptOut(BaseModel):
    """Modelo de la Recepción para respuestas de la API, con datos poblados."""
    id: PyObjectId = Field(..., alias="_id")
    receipt_number: str
    purchase_order_id: PyObjectId
    supplier: Optional[SupplierOut] = None
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    received_date: datetime
    notes: Optional[str] = ""
    items: List[GoodsReceiptItem]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})