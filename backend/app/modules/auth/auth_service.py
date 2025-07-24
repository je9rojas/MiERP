# /backend/app/modules/auth/auth_service.py
# SERVICIO PARA LA LÓGICA DE NEGOCIO DE AUTENTICACIÓN (REFACTORIZADO)

import os
import secrets
import json
from datetime import datetime, timezone
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional

# --- SECCIÓN 1: IMPORTACIONES ---
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.modules.users.user_models import UserRole, UserInDB

# --- SECCIÓN 2: FUNCIONES DEL SERVICIO (REFACTORIZADAS) ---

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
    Autentica un usuario y enriquece su documento con los permisos de su rol.
    Returns:
        El documento del usuario (dict) enriquecido con permisos si es exitoso, sino None.
    """
    user_doc = await db.users.find_one({"username": username})
    
    if not user_doc or user_doc.get("status") != "active":
        return None # No dar información sobre si el usuario existe o está inactivo
    
    if not verify_password(password, user_doc["password_hash"]):
        await db.users.update_one({"_id": user_doc["_id"]}, {"$inc": {"failed_login_attempts": 1}})
        return None
    
    # --- LÓGICA DE ENRIQUECIMIENTO CON PERMISOS ---
    # Busca el rol del usuario en la colección 'roles'
    role_doc = await db.roles.find_one({"name": user_doc["role"]})
    
    # Asigna los permisos del rol. Si el rol no existe en la colección 'roles',
    # o si es un superadmin (cuyos permisos son implícitos), se asigna una lista vacía
    # (la lógica de `permission_checker` manejará el caso superadmin por separado).
    user_doc["permissions"] = role_doc.get("permissions", []) if role_doc else []
    
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"failed_login_attempts": 0, "last_login": datetime.now(timezone.utc)}}
    )
    
    return user_doc

async def get_user_by_username(db: AsyncIOMotorDatabase, username: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene un usuario y sus permisos. Usado para la dependencia `get_current_active_user`.
    """
    user_doc = await db.users.find_one({"username": username}, {"password_hash": 0})
    
    if user_doc:
        role_doc = await db.roles.find_one({"name": user_doc["role"]})
        user_doc["permissions"] = role_doc.get("permissions", []) if role_doc else []
        user_doc["_id"] = str(user_doc["_id"])
        
    return user_doc

async def store_credentials_securely(username: str, password: str):
    """
    Almacena credenciales en un archivo JSON local. SOLO PARA DESARROLLO.
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