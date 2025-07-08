# /backend/app/models/purchase_order.py
# Estructura del documento PurchaseOrder en MongoDB, validado con Pydantic.

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from .shared import PyObjectId

class PurchaseOrderItem(BaseModel):
    """Sub-documento para cada ítem dentro de una orden de compra."""
    product_id: PyObjectId = Field(..., description="ID del producto en la colección de productos")
    product_code: str = Field(..., description="Código del producto para referencia rápida")
    product_name: str = Field(..., description="Nombre del producto para referencia rápida")
    quantity_ordered: int = Field(..., gt=0, description="Cantidad pedida al proveedor")
    unit_cost: float = Field(..., ge=0, description="Costo unitario del producto")

class PurchaseOrder(BaseModel):
    """Modelo principal para una Orden de Compra."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    supplier_id: PyObjectId = Field(..., description="ID del proveedor")
    supplier_name: str = Field(..., description="Nombre del proveedor para referencia rápida")
    order_date: datetime = Field(default_factory=datetime.utcnow)
    expected_delivery_date: Optional[datetime] = None
    
    # ESTADO: El campo clave para nuestro flujo de trabajo
    status: Literal["draft", "approved", "partially_received", "completed", "cancelled"] = Field(default="approved")
    
    items: List[PurchaseOrderItem] = Field(..., min_items=1)
    
    total_amount: float = Field(..., description="Calculado como sum(item.quantity * item.unit_cost)")
    notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }