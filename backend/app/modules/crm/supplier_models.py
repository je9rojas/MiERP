# /backend/app/modules/crm/supplier_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Proveedor' (Supplier).

Este módulo sigue una arquitectura DTO (Data Transfer Object) robusta, separando
las representaciones de los datos para diferentes casos de uso:
- Creación (Input DTO)
- Actualización (Input DTO)
- Almacenamiento en Base de Datos (Modelo Interno)
- Exposición a través de la API (Output DTO)
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_serializer
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: ENUMS Y MODELOS DE SOPORTE ANIDADOS
# ==============================================================================

class EmailPurpose(str, Enum):
    """Estandariza los propósitos comunes para los correos electrónicos de contacto."""
    GENERAL = "general"
    SALES = "ventas"
    BILLING = "cobranzas"
    LOGISTICS = "logística"
    SUPPORT = "soporte"

class SupplierEmail(BaseModel):
    """Representa un único correo electrónico de contacto con un propósito definido."""
    address: EmailStr = Field(..., description="La dirección de correo electrónico.")
    purpose: EmailPurpose = Field(EmailPurpose.GENERAL, description="El propósito o departamento asociado al correo.")

class ContactPerson(BaseModel):
    """Representa a una persona de contacto dentro de la empresa del proveedor."""
    name: str = Field(..., description="Nombre completo de la persona de contacto.")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico principal del contacto.")
    phone: Optional[str] = Field(None, description="Teléfono del contacto.")
    position: Optional[str] = Field(None, description="Cargo o puesto de la persona (ej. 'Jefe de Ventas').")


# ==============================================================================
# SECCIÓN 3: ARQUITECTURA DE MODELOS PRINCIPALES (DTOS)
# ==============================================================================

class SupplierBase(BaseModel):
    """Modelo base con los campos comunes que definen a un proveedor."""
    tax_id: str = Field(..., description="ID Fiscal (RUC, NIF, etc.). Debe ser único en el sistema.")
    business_name: str = Field(..., description="Razón Social (nombre legal) del proveedor.")
    trade_name: Optional[str] = Field(None, description="Nombre comercial con el que opera el proveedor.")
    address: Optional[str] = Field(None, description="Dirección fiscal principal del proveedor.")
    phone: Optional[str] = Field(None, description="Teléfono principal de contacto del proveedor.")
    emails: List[SupplierEmail] = Field(default_factory=list, description="Lista de correos electrónicos de contacto.")
    contact_person: Optional[ContactPerson] = Field(None, description="Datos de la persona de contacto principal.")

class SupplierCreate(SupplierBase):
    """
    DTO de Entrada para la creación de un nuevo proveedor.
    Hereda todos los campos de SupplierBase.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tax_id": "20123456789",
                "business_name": "ACME Corporation S.A.C.",
                "trade_name": "ACME Corp.",
                "address": "Av. Principal 123, Lima, Perú",
                "phone": "+5112345678",
                "emails": [
                    {"address": "ventas@acme.com", "purpose": "ventas"},
                    {"address": "pagos@acme.com", "purpose": "cobranzas"}
                ],
                "contact_person": {
                    "name": "Juan Pérez",
                    "email": "juan.perez@acme.com",
                    "phone": "+51987654321",
                    "position": "Gerente de Compras"
                }
            }
        }
    )

class SupplierUpdate(BaseModel):
    """
    DTO de Entrada para la actualización parcial de un proveedor.
    Todos los campos son opcionales.
    """
    business_name: Optional[str] = None
    trade_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    emails: Optional[List[SupplierEmail]] = None
    contact_person: Optional[ContactPerson] = None
    is_active: Optional[bool] = None

class SupplierInDB(SupplierBase):
    """Representa el documento completo del proveedor tal como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class SupplierOut(SupplierBase):
    """
    DTO de Salida que define la estructura de datos que la API devuelve al cliente.
    Es una representación segura y limpia del proveedor.
    """
    id: PyObjectId = Field(alias="_id")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('id')
    def serialize_id(self, id_obj: PyObjectId, _info):
        """Convierte el campo 'id' (ObjectId) a string al serializar a JSON."""
        return str(id_obj)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )