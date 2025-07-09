# /backend/app/services/role_service.py
# CÓDIGO FINAL Y COMPLETO PARA EL SERVICIO DE ROLES

from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import UserRole  # Asegura que tu modelo Enum de roles esté aquí

async def get_all_roles(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """
    Recupera una lista de todos los roles definidos en la colección 'roles'.

    Esta función es utilizada por el frontend para, por ejemplo, poblar
    listas desplegables en los formularios de creación o edición de usuarios.

    Args:
        db: La instancia de la base de datos inyectada por FastAPI.

    Returns:
        Una lista de diccionarios, donde cada diccionario representa un rol.
    """
    roles_list = []
    # La proyección {"_id": 0} se usa para excluir el ID de MongoDB de los resultados,
    # manteniendo la respuesta limpia y relevante para el cliente.
    roles_cursor = db.roles.find({}, {"_id": 0})
    
    # Itera de forma asíncrona sobre los resultados del cursor de la base de datos
    # y los agrega a la lista que se devolverá.
    async for role in roles_cursor:
        roles_list.append(role)
        
    return roles_list

async def initialize_roles(db: AsyncIOMotorDatabase):
    """
    Verifica y crea los roles base del sistema si aún no existen.

    Esta función se ejecuta una sola vez al iniciar la aplicación para asegurar
    que la colección 'roles' contenga todas las definiciones de rol necesarias
    para el funcionamiento del sistema, basadas en el Enum 'UserRole'.

    Args:
        db: La instancia de la base de datos inyectada por FastAPI.
    """
    print("🔄  Verificando la existencia de roles base en la base de datos...")
    
    try:
        # Itera sobre cada miembro del Enum UserRole (ej. 'superadmin', 'admin', etc.)
        for role_enum_member in UserRole:
            role_name = role_enum_member.value
            
            # Busca en la base de datos si ya existe un rol con ese nombre.
            existing_role = await db.roles.find_one({"name": role_name})
            
            # Si no existe, lo crea.
            if not existing_role:
                role_document = {
                    "name": role_name,
                    "description": f"Rol de sistema para el perfil de {role_name.capitalize()}."
                }
                await db.roles.insert_one(role_document)
                print(f"    -> Rol '{role_name}' no encontrado. Creando nuevo rol.")
                
        print("✅  Verificación de roles base completada exitosamente.")
        
    except Exception as e:
        # Captura cualquier error durante la interacción con la base de datos.
        print(f"❌  ERROR: Ocurrió un problema al inicializar los roles: {e}")