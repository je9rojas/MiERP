# /backend/app/modules/roles/role_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Rol'.
Estos modelos se utilizan para la validación de datos al crear, actualizar
y devolver información sobre los roles del sistema.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from bson import ObjectId

# Importamos el helper que ya tenemos para manejar los ObjectId de MongoDB
from app.models.shared import PyObjectId


# --- SECCIÓN 1: MODELOS DE ROL ---

class RoleBase(BaseModel):
    """Modelo base con los campos comunes de un rol."""
    name: str = Field(..., description="El nombre único del rol (ej. 'admin', 'sales').")
    description: str = Field(..., description="Una descripción clara de lo que el rol puede hacer.")
    # Para un futuro sistema de permisos granulares, añadirías:
    # permissions: List[str] = Field(default_factory=list)

class RoleCreate(RoleBase):
    """DTO de entrada para la creación de un nuevo rol."""
    pass

class RoleUpdate(BaseModel):
    """DTO de entrada para la actualización de un rol. Todos los campos son opcionales."""
    description: Optional[str] = None
    # permissions: Optional[List[str]] = None

class RoleInDB(RoleBase):
    """Modelo que representa el documento completo del Rol en la base de datos."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

class RoleOut(RoleInDB):
    """
    Modelo de salida seguro para devolver datos de roles a través de la API.
    Este es el modelo que las rutas importarán para sus respuestas.
    """
    pass