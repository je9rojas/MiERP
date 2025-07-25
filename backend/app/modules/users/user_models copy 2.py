# /backend/app/modules/users/user_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Usuario'.
Esta arquitectura separa las responsabilidades de los modelos para la creación (DTO de entrada),
el almacenamiento en la base de datos (la fuente de la verdad) y la exposición a través
de la API (DTO de salida), garantizando seguridad y consistencia de los datos.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

# --- IMPORTACIÓN CLAVE ---
# Se importa PyObjectId desde el módulo compartido, en lugar de redefinirlo aquí.
from app.models.shared import PyObjectId


# --- SECCIÓN 1: ENUMERACIONES Y SUB-MODELOS (CON MÉTODO RESTAURADO) ---

class UserRole(str, Enum):
    """Define los roles internos del sistema que un usuario puede tener."""
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"
    WAREHOUSE = "warehouse"
    ACCOUNTANT = "accountant"
    HR_RECRUITER = "hr_recruiter"

    # --- MÉTODO RESTAURADO ---
    # Este método es utilizado por otras partes de la aplicación (como los 'role_checkers')
    # para obtener una lista completa de todos los roles disponibles.
    @classmethod
    def all_roles(cls) -> List[str]:
        """Método de utilidad que devuelve una lista de todos los valores de los roles."""
        return [member.value for member in cls]

class UserStatus(str, Enum):
    """Define los estados de cuenta de un usuario."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class Branch(BaseModel):
    """Representa una sucursal o ubicación de la empresa."""
    name: str = Field(..., description="Nombre de la sucursal.")
    is_main: bool = Field(False, description="Indica si es la sucursal principal.")

class AuditLog(BaseModel):
    """Registra una acción de auditoría realizada sobre el usuario."""
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
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    audit_log: List[AuditLog] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserOut(UserBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )