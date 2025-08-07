# /backend/app/modules/crm/customer_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Cliente' (Customer).

Este módulo sigue una arquitectura DTO (Data Transfer Object) robusta, separando
las representaciones de los datos para diferentes casos de uso: creación,
actualización, almacenamiento en base de datos y exposición a través de la API.
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

class DocumentType(str, Enum):
    """Estandariza los tipos de documento de identidad."""
    RUC = "ruc"  # Registro Único de Contribuyentes (Perú)
    DNI = "dni"  # Documento Nacional de Identidad (Perú)
    CE = "ce"    # Carnet de Extranjería (Perú)
    OTHER = "other" # Para identificadores de otros países

class EmailPurpose(str, Enum):
    """Estandariza los propósitos para los correos de contacto."""
    GENERAL = "general"
    BILLING = "facturacion"
    SHIPPING = "envios"
    SUPPORT = "soporte"

class CustomerEmail(BaseModel):
    """Representa un único correo electrónico de contacto con un propósito definido."""
    address: EmailStr = Field(..., description="La dirección de correo electrónico.")
    purpose: EmailPurpose = Field(EmailPurpose.GENERAL, description="El propósito o departamento asociado al correo.")

class ContactPerson(BaseModel):
    """Representa a una persona de contacto dentro de la empresa del cliente."""
    name: str = Field(..., description="Nombre completo de la persona de contacto.")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico del contacto.")
    phone: Optional[str] = Field(None, description="Teléfono del contacto.")
    position: Optional[str] = Field(None, description="Cargo o puesto de la persona (ej. 'Jefe de Compras').")


# ==============================================================================
# SECCIÓN 3: ARQUITECTURA DE MODELOS PRINCIPALES (DTOS)
# ==============================================================================

class CustomerBase(BaseModel):
    """Modelo base con los campos comunes que definen a un cliente."""
    doc_type: DocumentType = Field(..., description="Tipo de documento de identidad.")
    doc_number: str = Field(..., description="Número del documento, debe ser único para el tipo de documento.")
    business_name: str = Field(..., description="Razón Social o Nombre completo del cliente.")
    address: Optional[str] = Field(None, description="Dirección fiscal principal del cliente.")
    phone: Optional[str] = Field(None, description="Teléfono principal de contacto.")
    emails: List[CustomerEmail] = Field(default_factory=list, description="Lista de correos electrónicos de contacto.")
    contact_person: Optional[ContactPerson] = Field(None, description="Datos de la persona de contacto principal.")

class CustomerCreate(CustomerBase):
    """DTO de Entrada para la creación de un nuevo cliente."""
    pass

class CustomerUpdate(BaseModel):
    """DTO de Entrada para la actualización parcial de un cliente. Todos los campos son opcionales."""
    business_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    emails: Optional[List[CustomerEmail]] = None
    contact_person: Optional[ContactPerson] = None
    is_active: Optional[bool] = None

class CustomerInDB(CustomerBase):
    """Representa el documento completo del cliente tal como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True, description="Indica si el cliente está activo en el sistema.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class CustomerOut(CustomerBase):
    """DTO de Salida que define la estructura de datos que la API devuelve al cliente."""
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
        from_attributes=True,
    )