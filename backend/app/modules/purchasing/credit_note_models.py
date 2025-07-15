from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date, datetime

class CreditNoteItem(BaseModel):
    product_code: str
    description: str
    quantity: int = Field(..., gt=0, description="Cantidad de producto que se devuelve o ajusta")
    unit_cost: float = Field(..., ge=0, description="El costo al que se está aplicando el crédito")

class CreditNote(BaseModel):
    id: str = Field(..., alias="_id")
    credit_note_number: str = Field(..., unique=True, description="Número de la nota de crédito (del proveedor o interno)")
    
    # --- Referencia al Documento Original ---
    original_purchase_order_id: str = Field(..., description="ID de la Orden de Compra que se está ajustando")
    original_invoice_code: str = Field(..., description="Número de la factura que se está ajustando")
    
    supplier_code: str
    
    # --- Fechas ---
    issue_date: date
    system_entry_date: datetime = Field(default_factory=datetime.utcnow)
    
    # --- Razón del Ajuste ---
    reason: str = Field(..., description="Motivo de la nota de crédito (ej: Devolución, Error en precio)")
    
    # --- Ítems (si aplica devolución de producto) ---
    items: Optional[List[CreditNoteItem]] = Field(None, description="Productos devueltos. Nulo si es solo un ajuste monetario.")
    
    # --- Valores ---
    subtotal: float
    tax_percentage: float
    tax_amount: float
    total_credit_amount: float = Field(..., description="Monto total del crédito a nuestro favor")
    
    # --- Auditoría ---
    registered_by_user_id: str
    
    status: Literal['aplicada', 'pendiente', 'anulada'] = Field(default='pendiente')