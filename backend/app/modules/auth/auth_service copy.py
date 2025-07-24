# /backend/app/modules/auth/auth_service.py
# SERVICIO PARA LA LÓGICA DE NEGOCIO DE AUTENTICACIÓN

import os
import secrets
import json
from datetime import datetime, timezone
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional

# --- SECCIÓN 1: IMPORTACIONES ---
# Importaciones del núcleo de la aplicación y de otros módulos.

from app.core.config import settings
from app.core.security import get_password_hash, verify_password

# Importamos los modelos necesarios desde el módulo de usuarios.
# Esta es la forma correcta de comunicación entre módulos.
from app.modules.users.user_models import UserRole, UserInDB


# --- SECCIÓN 2: FUNCIONES DEL SERVICIO ---

async def create_secure_superadmin(db: AsyncIOMotorDatabase) -> Optional[str]:
    """
    Crea un superadministrador si no existe ninguno en la base de datos.
    Genera credenciales seguras y las almacena en un archivo local para desarrollo.
    """
    existing_superadmin = await db.users.find_one({"role": UserRole.SUPERADMIN.value})
    if existing_superadmin:
        print("✅ Superadmin ya existe, no se tomará ninguna acción.")
        return None

    # Generación de credenciales seguras y aleatorias
    password = secrets.token_urlsafe(16)
    username = "initadmin_" + secrets.token_hex(4)
    password_hash = get_password_hash(password)

    superadmin_data = {
        "username": username,
        "name": "Administrador Inicial",
        "role": UserRole.SUPERADMIN.value,
        "phone": "",
        "address": "",
        "branch": {"name": "Sucursal Principal", "is_main": True},
        "status": "active",
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc),
        "audit_log": [{
            "action": "initial_creation",
            "ip": "system",
            "timestamp": datetime.now(timezone.utc)
        }],
        "requires_password_change": True
    }

    result = await db.users.insert_one(superadmin_data)
    await store_credentials_securely(username, password)
    print(f"✅ Superadmin seguro creado con ID: {result.inserted_id}")
    return str(result.inserted_id)


async def authenticate_user(db: AsyncIOMotorDatabase, username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Autentica un usuario por su nombre de usuario y contraseña.
    - Verifica si el usuario existe y está activo.
    - Compara la contraseña proporcionada con el hash almacenado.
    - Actualiza los registros de login.
    
    Returns:
        El documento del usuario como un diccionario si la autenticación es exitosa, sino None.
    """
    user_doc = await db.users.find_one({"username": username})
    
    if not user_doc:
        return None
    
    if user_doc.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta está inactiva o suspendida."
        )
    
    # Usa la función centralizada de 'security' para verificar la contraseña
    if not verify_password(password, user_doc["password_hash"]):
        await db.users.update_one({"_id": user_doc["_id"]}, {"$inc": {"failed_login_attempts": 1}})
        return None
    
    # Si el login es exitoso, resetea los intentos fallidos y actualiza la fecha de último login
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"failed_login_attempts": 0, "last_login": datetime.now(timezone.utc)}}
    )
    
    return user_doc



async def get_user_by_username(db: AsyncIOMotorDatabase, username: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene los datos públicos de un usuario por su nombre de usuario.
    Excluye campos sensibles como el hash de la contraseña.
    """
    projection = { "password_hash": 0, "audit_log": 0, "failed_login_attempts": 0 }
    user_doc = await db.users.find_one({"username": username}, projection)
    
    if user_doc:
        # Asegura que el _id sea un string para una correcta serialización a JSON
        user_doc["_id"] = str(user_doc["_id"])
        
    return user_doc


async def store_credentials_securely(username: str, password: str):
    """
    Almacena credenciales en un archivo JSON local.
    ADVERTENCIA: Este método es solo para la conveniencia en el desarrollo local.
    NUNCA debe usarse en un entorno de producción.
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
    print(f"🔐 Credenciales iniciales guardadas de forma segura en: {file_path}")