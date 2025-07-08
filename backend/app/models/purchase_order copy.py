from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date, datetime

class PurchaseOrderItem(BaseModel):
    # Línea de detalle de la compra
    product_code: str = Field(..., description="El código principal del producto comprado")
    description: str = Field(..., description="Descripción del producto (se puede autocompletar)")
    related_quote: Optional[str] = Field(None, description="N° de cotización/orden de compra del proveedor")
    quantity: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    # total_cost se calculará, no se almacena
    
class PurchaseOrder(BaseModel):
    id: str = Field(..., alias="_id")
    order_number: str = Field(..., unique=True, description="Número de orden de compra interno (autogenerado)")
    
    # --- Datos del Documento y Proveedor ---
    supplier_code: str = Field(..., description="Código del proveedor en nuestro sistema")
    supplier_invoice_code: str = Field(..., description="Código de la factura del proveedor")
    supplier_tax_id: str # Se autocompleta desde el proveedor
    supplier_legal_address: str # Se autocompleta

    # --- Fechas Clave ---
    system_entry_date: datetime = Field(default_factory=datetime.utcnow, description="Fecha de registro en el sistema")
    purchase_date: date = Field(..., description="Fecha de la compra (del documento)")
    issue_date: date = Field(..., description="Fecha de emisión de la factura")
    due_date: date = Field(..., description="Fecha de vencimiento para el pago")

    # --- Comprador (Datos de NUESTRA empresa para el documento) ---
    buyer_name: str = Field(..., description="Nombre de nuestra empresa")
    buyer_tax_id: str = Field(..., description="NIT/RUC de nuestra empresa")
    buyer_legal_address: str = Field(..., description="Domicilio legal de nuestra empresa")
    
    # --- Términos y Pagos ---
    incoterm: Optional[str] = Field(None)
    payment_method: str = Field(...) # Ej: 'Transferencia', 'Crédito 30 días'
    
    # --- Ítems de la Orden ---
    items: List[PurchaseOrderItem] = Field(...)
    
    # --- Cálculos Financieros ---
    subtotal: float # Calculado
    tax_percentage: float = Field(..., description="Porcentaje de impuesto, ej: 18.0 o 19.0")
    tax_amount: float # Calculado
    other_charges: float = Field(default=0.0)
    total_amount: float # Calculado

    # --- Auditoría ---
    registered_by_user_id: str = Field(..., description="ID del usuario que registró la compra")
    signature_name: Optional[str] = Field(None, description="Nombre de quien firma/aprueba")
    
    status: Literal['borrador', 'recibido', 'pagado_parcial', 'pagado_total', 'cancelado'] = Field(default='borrador')