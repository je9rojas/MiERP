# /backend/app/modules/crm/supplier_models.py
# MODELOS DE DATOS PARA LA ENTIDAD 'PROVEEDOR'

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone

# Importamos la clase de ayuda para ObjectId desde un lugar central
# para evitar duplicación. Asumimos que la moverás o la crearás en un lugar común.
# Por ahora, la importamos desde 'inventory' como ejemplo.
from app.modules.inventory.product_models import PyObjectId

# --- Modelos de Soporte ---

class ContactPerson(BaseModel):
    """Representa a una persona de contacto dentro de la empresa del proveedor."""
    name: str = Field(..., description="Nombre completo de la persona de contacto.")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico de contacto.")
    phone: Optional[str] = Field(None, description="Teléfono de contacto.")
    position: Optional[str] = Field(None, description="Cargo o puesto de la persona (ej. 'Jefe de Ventas').")


# --- ARQUITECTURA DE MODELOS PRINCIPALES ---

# 1. Modelo de Entrada para CREACIÓN (DTO)
class SupplierCreate(BaseModel):
    """Define los datos necesarios para registrar un nuevo proveedor."""
    ruc: str = Field(..., description="Registro Único de Contribuyentes (o ID Fiscal). Debe ser único.")
    business_name: str = Field(..., description="Razón Social (nombre legal) del proveedor.")
    trade_name: Optional[str] = Field(None, description="Nombre comercial con el que opera el proveedor.")
    address: Optional[str] = Field(None, description="Dirección fiscal principal del proveedor.")
    phone: Optional[str] = Field(None, description="Teléfono principal del proveedor.")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico principal del proveedor.")
    contact_person: Optional[ContactPerson] = Field(None, description="Datos de la persona de contacto principal.")


# 2. Modelo de Entrada para ACTUALIZACIÓN (DTO)
# Todos los campos son opcionales para permitir actualizaciones parciales.
class SupplierUpdate(BaseModel):
    business_name: Optional[str] = None
    trade_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[ContactPerson] = None
    is_active: Optional[bool] = None


# 3. Modelo de Base de Datos (La "Fuente de la Verdad")
# Representa el documento completo como se almacena en MongoDB.
class SupplierInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    ruc: str
    business_name: str
    trade_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[ContactPerson] = None
    
    # Campos gestionados por el servidor
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = { "ObjectId": str }


# 4. Modelo de Salida (DTO)
# Define la estructura de datos que la API devuelve al frontend.
class SupplierOut(SupplierInDB):
    pass