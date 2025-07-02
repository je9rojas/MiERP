# /backend/app/models/customer.py

    role: Optional[UserRole] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Optional[Branch] = None
    status: pydantic import BaseModel, Field
from typing import Optional, List

# Schema base para un cliente, usado para creación y actualización
class CustomerBase(BaseModel):
    name: str = Field(..., max_length=2 Optional[str] = None