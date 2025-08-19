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

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: ENUMS Y MODELOS DE SOPORTE ANIDADOS
# ==============================================================================

class DocumentType(str, Enum):
    """Estandariza los tipos de documento de identidad."""
    RUC = "ruc"
    DNI = "dni"
    CE = "ce"
    OTHER = "other"

class EmailPurpose(str, Enum):
    """Estandariza los propósitos para los correos de contacto."""
    GENERAL = "general"
    BILLING = "facturacion"
    SHIPPING = "envios"
    SUPPORT = "soporte"

class CustomerEmail(BaseModel):
    """Representa un único correo electrónico de contacto con un propósito definido."""
    address: EmailStr
    purpose: EmailPurpose = EmailPurpose.GENERAL
    model_config = ConfigDict(from_attributes=True)

class ContactPerson(BaseModel):
    """Representa a una persona de contacto dentro de la empresa del cliente."""
    name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    position: Optional[str] = Field(None, max_length=100)
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# SECCIÓN 3: ARQUITECTURA DE MODELOS PRINCIPALES (DTOS)
# ==============================================================================

class CustomerBase(BaseModel):
    """Modelo base con los campos comunes que definen a un cliente."""
    doc_type: DocumentType
    doc_number: str = Field(..., max_length=20)
    business_name: str = Field(..., max_length=200)
    address: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    emails: List[CustomerEmail] = Field(default_factory=list)
    contact_person: Optional[ContactPerson] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )

class CustomerCreate(CustomerBase):
    """DTO de Entrada para la creación de un nuevo cliente. Hereda todos los campos base."""
    pass

class CustomerUpdate(BaseModel):
    """
    DTO de Entrada para la actualización parcial de un cliente.
    Todos los campos son opcionales.
    """
    doc_type: Optional[DocumentType] = None
    doc_number: Optional[str] = Field(None, max_length=20)
    business_name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    emails: Optional[List[CustomerEmail]] = None
    contact_person: Optional[ContactPerson] = None
    is_active: Optional[bool] = None

class CustomerInDB(CustomerBase):
    """Representa el documento completo del cliente tal como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(
        populate_by_name=True, # Permite la creación desde `_id`
        from_attributes=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )

class CustomerOut(CustomerBase):
    """DTO de Salida que define la estructura de datos que la API devuelve al cliente."""
    id: PyObjectId = Field(..., alias="_id")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )