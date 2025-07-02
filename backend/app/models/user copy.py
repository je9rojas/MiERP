# /backend/app/models/user.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "vendedor"
    WAREHOUSE = "almacenero"

class Branch(BaseModel):
    name: str
    is_main: bool

class AuditLog(BaseModel):
    action: str
    ip: str
    timestamp: datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    name: str = Field(..., min_length=3, max_length=100)
    # --- NUEVO CAMPO AÑADIDO ---
    tax_id: Optional[str] = Field(None, max_length=20, description="RUC o DNI del usuario/cliente")
    role: UserRole
    phone: str = Field(default="", max_length=20)
    address: str = Field(default="", max_length=200)
    branch: Branch
    password: str = Field(..., min_length=8)

class UserDB(UserCreate):
    _id: str
    status: str = "active"
    points: int = 0
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    audit_log: List[AuditLog] = []

    class Config:
        json_schema_extra = {
            "example": {
                "_id": "ObjectId",
                "username": "superadmin",
                "name": "Administrador Principal",
                "role": "superadmin",
                "phone": "+51 987654321",
                "address": "Av. Principal 123, Lima, Perú",
                "branch": {
                    "name": "Sucursal Central",
                    "is_main": True
                },
                "password_hash": "$2b$12$...",
                "status": "active",
                "created_at": "2023-01-01T00:00:00Z",
                "last_login": None,
                "audit_log": []
            }
        }

# --- SCHEMAS DE RESPUESTA MODIFICADOS ---

class UserOut(BaseModel):
    username: str
    name: str
    # --- NUEVO CAMPO AÑADIDO ---
    tax_id: Optional[str] = None
    role: UserRole
    status: str
    phone: Optional[str]
    branch: Branch
    last_login: Optional[datetime] = None

class RoleOut(BaseModel):
    name: str
    description: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    # --- NUEVO CAMPO AÑADIDO ---
    tax_id: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Optional[Branch] = None
    status: Optional[str] = None