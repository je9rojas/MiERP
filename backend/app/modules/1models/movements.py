# backend/app/models/movements.py
class ProductMovement(BaseModel):
    date: datetime
    type: Literal["purchase", "sale", "adjustment"]
    document_id: str # ID de la orden de compra, factura, etc.
    quantity_change: int # ej. +50 para una compra, -2 para una venta
    new_stock: int
    cost: Optional[float] = None
    price: Optional[float] = None