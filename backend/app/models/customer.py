# /backend/app/models/customer.py

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# Modelo para una dirección física, reutilizable
class Address(BaseModel):
    street: str = Field(..., description="Calle, número, etc.")
    city: str = Field(..., description="Ciudad o Distrito")
    state: str = Field(..., description="Estado o Provincia")
    country: str = Field(..., description="País")
    zip_code: Optional[str] = Field(None, description="Código Postal")
    is_primary: bool = Field(False, description="Indica si es la dirección principal")

# Schema base para un cliente, con los campos comunes
class CustomerBase(BaseModel):
    name: str = Field(..., max_length=200, description="Nombre o Razón Social del Cliente")
    tax_id: str = Field(..., max_length=20, description="RUC o DNI del Cliente")
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)

# Schema para crear un nuevo cliente en la base de datos
class CustomerCreate(CustomerBase):
    primary_address: Address
    other_addresses: Optional[List[Address]] = []
    # Aquí se podrían añadir más campos como 'assigned_salesperson_id', 'price_list', etc.

# Schema para la respuesta de la API, incluye datos generados por el sistema
class CustomerOut(CustomerCreate):
    id: str = Field(..., alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"