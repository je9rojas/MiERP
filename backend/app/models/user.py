# /backend/app/models/user.py
# CÓDIGO FINAL Y COMPLETO CON NOMBRES EN INGLÉS

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

# --- Definición de Roles del Sistema (en inglés) ---

class UserRole(str, Enum):
    """
    Defines the internal system roles that a user can have.
    These roles control access to different parts of the application.
    """
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"  # <-- CAMBIO: vendedor -> sales
    WAREHOUSE = "warehouse" # <-- CAMBIO: almacenero -> warehouse
    ACCOUNTANT = "accountant" # <-- CAMBIO: contador -> accountant
    HR_RECRUITER = "hr_recruiter" # <-- CAMBIO: reclutador_rrhh -> hr_recruiter

    @classmethod
    def all_roles(cls) -> List[str]:
        """
        Utility method that returns a list of all role values.
        Essential for dependencies that need to validate against all possible roles.
        """
        return [member.value for member in cls]

# --- El resto del archivo permanece igual, ya que sus nombres de campo ya estaban bien ---

class Branch(BaseModel):
    name: str = Field(..., description="Name of the branch or location")
    is_main: bool = Field(False, description="Indicates if this is the main branch")

class AuditLog(BaseModel):
    action: str = Field(..., description="Action performed, e.g., 'user_created', 'password_changed'")
    ip: str = Field(..., description="IP address from where the action was performed")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$", description="Unique username for login")
    name: str = Field(..., min_length=3, max_length=100, description="Full name of the employee")
    role: UserRole
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200, description="Employee's address")
    branch: Branch

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password for the new user")

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    role: Optional[UserRole] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=200)
    branch: Optional[Branch] = None
    status: Optional[str] = None # e.g., 'active', 'inactive'

class UserInDB(UserBase):
    id: str = Field(..., alias="_id")
    status: str = "active"
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    audit_log: List[AuditLog] = Field(default_factory=list)

    class Config:
        from_attributes = True
        populate_by_name = True

class UserOut(BaseModel):
    username: str
    name: str
    role: UserRole
    status: str
    phone: Optional[str]
    branch: Branch
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class RoleOut(BaseModel):
    name: str
    description: str