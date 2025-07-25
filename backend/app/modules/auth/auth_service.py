# /backend/app/modules/auth/auth_service.py

"""
Capa de servicio para la lógica de negocio del módulo de Autenticación.
Este archivo contiene las funciones principales para autenticar usuarios,
gestionar la creación del superadministrador inicial y obtener datos de usuario
de forma segura desde la base de datos.
"""

import os
import secrets
import json
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional

# --- SECCIÓN 1: IMPORTACIONES ---
from app.core.security import get_password_hash, verify_password
from app.modules.users.user_models import UserRole, UserInDB


# --- SECCIÓN 2: LÓGICA DE OBTENCIÓN DE USUARIOS ---

async def get_user_by_username_for_auth(db: AsyncIOMotorDatabase, username: str) -> Optional[Dict[str, Any]]:
    """
    Busca un usuario por su nombre de usuario y devuelve el documento COMPLETO.
    Esta función incluye el `password_hash` y solo debe ser utilizada por procesos
    internos de autenticación y validación de tokens.

    Args:
        db: Instancia de la base de datos.
        username: El nombre de usuario a buscar.

    Returns:
        El documento completo del usuario si se encuentra, de lo contrario None.
    """
    user_document = await db["users"].find_one({"username": username})
    return user_document


# --- SECCIÓN 3: LÓGICA DE AUTENTICACIÓN Y CREACIÓN DE SUPERADMIN ---

async def authenticate_user(db: AsyncIOMotorDatabase, username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Verifica las credenciales de un usuario contra la base de datos.

    Args:
        db: Instancia de la base de datos.
        username: El nombre de usuario proporcionado.
        password: La contraseña en texto plano proporcionada.

    Returns:
        El documento del usuario si la autenticación es exitosa, de lo contrario None.
    """
    user_document = await get_user_by_username_for_auth(db, username)
    
    # Verificación de seguridad: no revelar si el usuario no existe o está inactivo.
    if not user_document or user_document.get("status") != "active":
        return None
    
    if not verify_password(password, user_document["password_hash"]):
        # Opcional: registrar intentos de login fallidos
        return None
    
    # En un login exitoso, se podrían actualizar campos como 'last_login'
    await db.users.update_one(
        {"_id": user_document["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    return user_document

async def create_secure_superadmin(db: AsyncIOMotorDatabase) -> Optional[str]:
    """
    Crea un usuario superadministrador si no existe ninguno.
    Genera credenciales seguras y las almacena en un archivo local para desarrollo.
    """
    print("INFO:     Paso 1/4: Verificando existencia de superadmin...")
    existing_superadmin = await db.users.find_one({"role": UserRole.SUPERADMIN.value})
    if existing_superadmin:
        print("INFO:     Superadmin ya existe. No se tomará ninguna acción. ✅")
        return None

    print("INFO:     Paso 2/4: Generando credenciales seguras...")
    password = secrets.token_urlsafe(16)
    username = "initadmin_" + secrets.token_hex(4)
    
    # Se utiliza el modelo Pydantic 'UserInDB' para asegurar la estructura correcta de los datos.
    superadmin_model = UserInDB(
        username=username,
        name="Administrador del Sistema",
        role=UserRole.SUPERADMIN,
        status="active",
        password_hash=get_password_hash(password),
        # Se pueden añadir otros campos con valores por defecto si el modelo los requiere.
    )

    print("INFO:     Paso 3/4: Insertando nuevo superadmin en la base de datos...")
    superadmin_doc = superadmin_model.model_dump(by_alias=True)
    result = await db.users.insert_one(superadmin_doc)
    
    await store_credentials_securely(username, password)
    print(f"INFO:     Paso 4/4: Usuario superadmin verificado/creado. ✅")
    return str(result.inserted_id)

async def store_credentials_securely(username: str, password: str):
    """
    Almacena credenciales en un archivo JSON local. ADVERTENCIA: SOLO PARA DESARROLLO.
    """
    secure_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'secure')
    if not os.path.exists(secure_dir):
        os.makedirs(secure_dir, mode=0o700)
    
    file_path = os.path.join(secure_dir, "initial_credentials.json")
    credentials = {
        "username": username,
        "password": password,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "warning": "ESTE ARCHIVO CONTIENE CREDENCIALES SENSIBLES. NO COMPARTIR NI SUBIR A GIT."
    }
    with open(file_path, 'w') as f:
        json.dump(credentials, f, indent=2)
    
    os.chmod(file_path, 0o600)
    print(f"🔐 INFO:   Credenciales iniciales guardadas de forma segura en: {os.path.abspath(file_path)}")