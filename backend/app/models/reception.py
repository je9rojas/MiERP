# /backend/app/models/reception.py
# Estructura del documento GoodsReceipt (Recepción de Mercancía) en MongoDB

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .shared import PyObjectId

class ReceptionItem(BaseModel):
    """Sub-documento para cada ítem dentro de una recepción."""
    product_id: PyObjectId = Field(..., description="ID del producto")
    product_code: str = Field(...)
    product_name: str = Field(...)
    quantity_ordered: int = Field(..., description="Cantidad que estaba en la PO original")
    quantity_received: int = Field(..., ge=0, description="Cantidad que realmente llegó")

class Reception(BaseModel):
    """Modelo principal para una Recepción de Mercancía."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    purchase_order_id: PyObjectId = Field(..., description="ID de la Orden de Compra asociada")
    supplier_id: PyObjectId = Field(..., description="ID del proveedor")
    supplier_name: str = Field(...)
    
    reception_date: datetime = Field(default_factory=datetime.utcnow)
    items: List[ReceptionItem] = Field(..., min_items=1)
    
    notes: Optional[str] = None
    created_by_user_id: Optional[PyObjectId] = None # Opcional, pero buena práctica
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }