# /backend/app/modules/users/user_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Usuario'.
"""

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId

# Importamos la versión ÚNICA y CORRECTA de PyObjectId desde el módulo compartido.
from app.models.shared import PyObjectId


# --- SECCIÓN 1: ENUMERACIONES Y SUB-MODELOS ---

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SELLER = "seller"
    WAREHOUSE = "warehouse"
    ACCOUNTANT = "accountant"
    HR_RECRUITER = "hr_recruiter"

    @classmethod
    def all_roles(cls) -> List[str]:
        return [member.value for member in cls]

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class Branch(BaseModel):
    name: str = Field(..., description="Nombre de la sucursal.")
    is_main: bool = Field(False, description="Indica si es la sucursal principal.")

class AuditLog(BaseModel):
    action: str = Field(..., description="Acción realizada.")
    ip: str = Field(..., description="Dirección IP de la acción.")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- SECCIÓN 2: ARQUITECTURA DE MODELOS DE USUARIO ---

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    name: str = Field(..., min_length=3, max_length=100)
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Branch

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Optional[Branch] = None

class UserInDB(UserBase):
    """Modelo interno para la base de datos. No sabe cómo serializar a JSON."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    audit_log: List[AuditLog] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class UserOut(UserBase):
    """
    Modelo de salida seguro para la API (SOLUCIÓN FINAL).
    Este modelo sabe exactamente cómo presentarse en formato JSON.
    """
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    last_login: Optional[datetime] = None

    # --- SOLUCIÓN DEFINITIVA: Serializador de campo específico ---
    # Este decorador le dice a Pydantic: "SOLO cuando estés serializando
    # (convirtiendo a JSON) una instancia de UserOut, para el campo 'id',
    # ejecuta esta función para obtener el valor".
    # Esto es explícito, localizado y no afecta a ningún otro proceso.
    @field_serializer('id')
    def serialize_id(self, id_obj: ObjectId, _info):
        return str(id_obj)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)