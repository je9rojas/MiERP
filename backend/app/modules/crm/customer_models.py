# /backend/app/modules/crm/customer_models.py
# MODELOS DE DATOS PARA LA ENTIDAD 'CLIENTE'

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone

# Asumimos que PyObjectId está en un archivo de modelos compartidos
from app.models.shared import PyObjectId

# --- Modelos de Soporte (pueden ser compartidos en el futuro) ---
class ContactPerson(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None

# --- ARQUITECTURA DE MODELOS DE CLIENTE ---

# 1. Modelo de Entrada para CREACIÓN
class CustomerCreate(BaseModel):
    """Define los datos necesarios para registrar un nuevo cliente."""
    doc_type: str # Tipo de documento: RUC, DNI, etc.
    doc_number: str = Field(..., description="Número del documento, debe ser único.")
    business_name: str = Field(..., description="Razón Social o Nombre completo del cliente.")
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[ContactPerson] = None

# --- ¡CLASE AÑADIDA! ---
# 2. Modelo de Entrada para ACTUALIZACIÓN
class CustomerUpdate(BaseModel):
    """Define los campos que se pueden actualizar de un cliente. Todos son opcionales."""
    business_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[ContactPerson] = None
    is_active: Optional[bool] = None

# 3. Modelo de Base de Datos
class CustomerInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    doc_type: str
    doc_number: str
    business_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[ContactPerson] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = { "ObjectId": str }

# 4. Modelo de Salida
class CustomerOut(CustomerInDB):
    pass