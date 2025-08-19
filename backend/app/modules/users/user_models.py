# /backend/app/modules/users/user_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Usuario'.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: ENUMERACIONES Y SUB-MODELOS
# ==============================================================================

class UserRole(str, Enum):
    """Define los roles de usuario disponibles en el sistema."""
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"  # <- CORRECCIÓN: Renombrado de SELLER a SALES por consistencia
    WAREHOUSE = "warehouse"
    ACCOUNTANT = "accountant"
    HR_RECRUITER = "hr_recruiter"

    @classmethod
    def all_roles(cls) -> List[str]:
        """Devuelve una lista de todos los valores de los roles."""
        return [member.value for member in cls]

class UserStatus(str, Enum):
    """Define los estados de actividad de un usuario."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class Branch(BaseModel):
    """Representa una sucursal o ubicación de la empresa."""
    name: str = Field(..., description="Nombre de la sucursal.")
    is_main: bool = Field(False, description="Indica si es la sucursal principal.")
    model_config = ConfigDict(from_attributes=True)

class AuditLog(BaseModel):
    """Registra una acción de auditoría realizada por un usuario."""
    action: str = Field(..., description="Acción realizada.")
    ip: str = Field(..., description="Dirección IP de la acción.")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# SECCIÓN 3: ARQUITECTURA DE MODELOS DE USUARIO
# ==============================================================================

class UserBase(BaseModel):
    """Modelo base con los campos comunes de un usuario."""
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    name: str = Field(..., min_length=3, max_length=100)
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Branch
    
    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )

class UserCreate(UserBase):
    """DTO para la creación de un nuevo usuario."""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """DTO para la actualización parcial de un usuario."""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Optional[Branch] = None

class UserInDB(UserBase):
    """Modelo que representa al usuario en la base de datos, incluyendo datos sensibles."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    audit_log: List[AuditLog] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

class UserOut(UserBase):
    """DTO de salida, seguro para ser expuesto en la API."""
    id: PyObjectId = Field(..., alias="_id")
    created_at: datetime
    last_login: Optional[datetime] = None

    # El serializador de campo ya no es necesario aquí.
    # La clase PyObjectId en `app/models/shared.py` ya maneja la serialización
    # de ObjectId a string de forma global para toda la aplicación.
    # Esto mantiene el código más limpio y sigue el principio DRY.
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )