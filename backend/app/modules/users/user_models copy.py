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
from bson import ObjectId


# --- SECCIÓN 1: HELPER PARA OBJECTID DE MONGODB ---

class PyObjectId(ObjectId):
    """
    Clase personalizada para manejar los ObjectId de MongoDB, permitiendo
    la validación y serialización directa dentro de los modelos Pydantic.
    """
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.is_instance_schema(ObjectId),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

# --- SECCIÓN 2: ENUMERACIONES Y SUB-MODELOS ---

class UserRole(str, Enum):
    """Define los roles internos del sistema que un usuario puede tener."""
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"
    WAREHOUSE = "warehouse"
    ACCOUNTANT = "accountant"
    HR_RECRUITER = "hr_recruiter"

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
    action: str = Field(..., description="Acción realizada (ej. 'user_created', 'password_changed').")
    ip: str = Field(..., description="Dirección IP desde la que se realizó la acción.")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- SECCIÓN 3: ARQUITECTURA DE MODELOS DE USUARIO ---

class UserBase(BaseModel):
    """Modelo base con los campos comunes y públicos de un usuario."""
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$", description="Nombre de usuario único para el login.")
    name: str = Field(..., min_length=3, max_length=100, description="Nombre completo del empleado.")
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200, description="Dirección del empleado.")
    branch: Branch

class UserCreate(UserBase):
    """DTO de entrada para la creación de un nuevo usuario."""
    password: str = Field(..., min_length=8, description="Contraseña para el nuevo usuario.")

class UserUpdate(BaseModel):
    """DTO de entrada para la actualización de un usuario. Todos los campos son opcionales."""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Optional[Branch] = None

class UserInDB(UserBase):
    """
    Modelo que representa el documento completo del usuario como se almacena
    y se lee de la base de datos, incluyendo campos sensibles como el hash de la contraseña.
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    audit_log: List[AuditLog] = Field(default_factory=list)

    # Configuración de Pydantic para una correcta interacción con MongoDB.
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True, # Permite tipos como ObjectId
        json_encoders={ObjectId: str},
    )

class UserOut(UserBase):
    """
    Modelo de salida seguro para devolver datos de usuario a través de la API.
    Excluye explícitamente cualquier campo sensible.
    """
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )