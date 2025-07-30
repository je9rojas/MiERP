# /backend/app/modules/crm/supplier_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Proveedor' (Supplier).
Sigue una arquitectura DTO (Data Transfer Object) para separar las representaciones
de los datos para la creación, actualización, almacenamiento y exposición en la API.
"""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

# Importamos la clase de ayuda para ObjectId desde el módulo compartido.
from app.models.shared import PyObjectId

# --- Modelos de Soporte ---

class ContactPerson(BaseModel):
    """Representa a una persona de contacto dentro de la empresa del proveedor."""
    name: str = Field(..., description="Nombre completo de la persona de contacto.")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico de contacto.")
    phone: Optional[str] = Field(None, description="Teléfono de contacto.")
    position: Optional[str] = Field(None, description="Cargo o puesto de la persona (ej. 'Jefe de Ventas').")

# --- ARQUITECTURA DE MODELOS PRINCIPALES ---

class SupplierBase(BaseModel):
    """Modelo base con los campos comunes de un proveedor."""
    ruc: str = Field(..., description="Registro Único de Contribuyentes (o ID Fiscal). Debe ser único.")
    business_name: str = Field(..., description="Razón Social (nombre legal) del proveedor.")
    trade_name: Optional[str] = Field(None, description="Nombre comercial con el que opera el proveedor.")
    address: Optional[str] = Field(None, description="Dirección fiscal principal del proveedor.")
    phone: Optional[str] = Field(None, description="Teléfono principal del proveedor.")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico principal del proveedor.")
    contact_person: Optional[ContactPerson] = Field(None, description="Datos de la persona de contacto principal.")

# 1. Modelo de Entrada para CREACIÓN (DTO)
class SupplierCreate(SupplierBase):
    """Define los datos estrictamente necesarios para registrar un nuevo proveedor desde la API."""
    pass

# 2. Modelo de Entrada para ACTUALIZACIÓN (DTO)
class SupplierUpdate(BaseModel):
    """Define los campos que se pueden actualizar. Todos son opcionales."""
    ruc: Optional[str] = None
    business_name: Optional[str] = None
    trade_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[ContactPerson] = None
    is_active: Optional[bool] = None

# 3. Modelo de Base de Datos (La "Fuente de la Verdad")
class SupplierInDB(SupplierBase):
    """Representa el documento completo como se almacena y se lee de MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

# 4. Modelo de Salida (DTO)
class SupplierOut(SupplierBase):
    """Define la estructura de datos que la API devuelve al frontend. Es segura y limpia."""
    id: PyObjectId = Field(alias="_id")
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Este decorador, que ya usamos en UserOut, es la forma correcta de serializar.
    # Lo añadimos aquí por consistencia y para que el modelo sepa presentarse.
    @Field.serializer('id')
    def serialize_id(self, id_obj: PyObjectId, _info):
        return str(id_obj)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )