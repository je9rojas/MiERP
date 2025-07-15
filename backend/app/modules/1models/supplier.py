from pydantic import BaseModel, Field
from typing import Optional

class Supplier(BaseModel):
    id: str = Field(..., alias="_id")
    code: str = Field(..., unique=True, description="Código interno único para el proveedor")
    name: str = Field(..., description="Nombre comercial del proveedor")
    tax_id: str = Field(..., description="Número de identificación fiscal (NIT, RUC, VAT ID, etc.)")
    legal_address: str = Field(..., description="Domicilio legal de la empresa proveedora")
    # ... otros campos como teléfono, email de contacto, etc.