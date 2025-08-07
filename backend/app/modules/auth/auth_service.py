# /backend/app/modules/auth/auth_service.py

"""
Capa de servicio para la lógica de negocio del módulo de Autenticación.
Contiene las funciones para autenticar usuarios y gestionar el superadministrador.
"""

import os
import secrets
import json
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional

from app.core.security import get_password_hash, verify_password
from app.modules.users.user_models import UserRole, UserInDB


async def get_user_by_username_for_auth(db: AsyncIOMotorDatabase, username: str) -> Optional[Dict[str, Any]]:
    """
    Busca un usuario por su nombre de usuario y devuelve el documento completo,
    incluyendo el hash de la contraseña, para uso interno de autenticación.
    """
    return await db["users"].find_one({"username": username})


async def authenticate_user(db: AsyncIOMotorDatabase, username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Verifica las credenciales de un usuario contra la base de datos.
    """
    user_document = await get_user_by_username_for_auth(db, username)

    if not user_document or user_document.get("status") != "active":
        return None
    
    if not verify_password(password, user_document.get("password_hash", "")):
        return None
    
    await db.users.update_one(
        {"_id": user_document["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    # --- CORRECCIÓN CLAVE ---
    # Devuelve el documento del usuario si la autenticación es exitosa.
    return user_document


async def create_secure_superadmin(db: AsyncIOMotorDatabase) -> None:
    """
    Crea un superadministrador con credenciales seguras si no existe ninguno.
    """
    if await db.users.count_documents({"role": UserRole.SUPERADMIN.value}) > 0:
        print("INFO:     Superadmin ya existe. No se tomará ninguna acción. ✅")
        return

    print("INFO:     Creando nuevo superadmin con credenciales seguras...")
    password = secrets.token_urlsafe(16)
    username = "initadmin_" + secrets.token_hex(4)
    
    superadmin_model = UserInDB(
        username=username,
        name="Administrador del Sistema",
        role=UserRole.SUPERADMIN,
        status="active",
        password_hash=get_password_hash(password),
    )
    
    await db.users.insert_one(superadmin_model.model_dump(by_alias=True))
    await store_credentials_securely(username, password)
    print("INFO:     Nuevo superadmin creado exitosamente. ✅")


async def store_credentials_securely(username: str, password: str):
    """
    Almacena credenciales en un archivo JSON local. ADVERTENCIA: SOLO PARA DESARROLLO.
    """
    secure_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'secure')
    os.makedirs(secure_dir, exist_ok=True, mode=0o700)
    
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
    print(f"🔐 INFO:   Credenciales iniciales guardadas en: {os.path.abspath(file_path)}")