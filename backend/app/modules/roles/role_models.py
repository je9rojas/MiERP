# /backend/app/modules/roles/role_models.py

"""
Define los modelos de datos para Roles y Permisos.
Esta será la estructura utilizada en la colección 'roles' de MongoDB.
"""
from pydantic import BaseModel, Field
from typing import List
from app.models.shared import PyObjectId

class Role(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., description="El nombre único del rol (ej: 'admin', 'warehouse_manager').")
    description: str = Field(..., description="Una breve descripción de lo que hace el rol.")
    permissions: List[str] = Field(default_factory=list, description="Lista de claves de permiso que tiene este rol.")

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}
        schema_extra = {
            "example": {
                "name": "admin",
                "description": "Administrador del sistema con acceso a compras y usuarios.",
                "permissions": ["can_crud_purchase_orders", "can_manage_users"]
            }
        }

class RoleOut(BaseModel):
    name: str
    description: str
    permissions: List[str]