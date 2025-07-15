# /backend/app/modules/roles/role_service.py
# SERVICIO FINAL Y PROFESIONAL PARA LA GESTIÓN DE ROLES

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any

# --- Importaciones ---
from app.modules.users.user_models import UserRole
from .repositories.role_repository import RoleRepository # Importamos el repositorio

# --- Funciones del Servicio ---

async def get_all_roles(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """
    Recupera una lista de todos los roles definidos, llamando al repositorio.
    """
    repo = RoleRepository(db)
    return await repo.find_all()


async def initialize_roles(db: AsyncIOMotorDatabase):
    """
    Verifica y crea los roles base del sistema si aún no existen.
    Esta función contiene la lógica de negocio para la inicialización de roles.
    """
    print("🔄  Verificando la existencia de roles base en la base de datos...")
    repo = RoleRepository(db)
    
    try:
        for role_enum_member in UserRole:
            role_name = role_enum_member.value
            
            # La lógica de negocio es: "¿Existe este rol?"
            existing_role = await repo.find_one_by_name(role_name)
            
            # Si no existe, la lógica es: "Créalo".
            if not existing_role:
                role_document = {
                    "name": role_name,
                    "description": f"Rol de sistema para el perfil de {role_name.capitalize()}."
                }
                await repo.insert_one(role_document)
                print(f"    -> Rol '{role_name}' no encontrado. Creando nuevo rol.")
                
        print("✅  Verificación de roles base completada exitosamente.")
        
    except Exception as e:
        print(f"❌  ERROR: Ocurrió un problema al inicializar los roles: {e}")