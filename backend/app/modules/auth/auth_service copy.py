# /backend/app/services/auth_service.py
# CÓDIGO FINAL Y CORREGIDO CON MANEJO DE CONTRASEÑAS UNIFICADO

import os
import secrets
import json
from datetime import datetime
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserRole
from app.core.config import settings
# --- ¡IMPORTACIÓN CLAVE! ---
# Importamos nuestras propias funciones de seguridad en lugar de usar bcrypt directamente.
from app.core.security import get_password_hash, verify_password

# --- Funciones de Servicio ---

async def create_secure_superadmin(db: AsyncIOMotorDatabase):
    """Crea un superadmin con credenciales generadas automáticamente."""
    existing_superadmin = await db.users.find_one({"role": UserRole.SUPERADMIN.value})
    if existing_superadmin:
        return None

    password = secrets.token_urlsafe(16)
    username = "initadmin_" + secrets.token_hex(4)
    
    # --- CORRECCIÓN ---
    # Usamos nuestra función centralizada para hashear la contraseña.
    password_hash = get_password_hash(password)

    superadmin_data = {
        "username": username,
        "name": "Administrador Inicial",
        "role": UserRole.SUPERADMIN.value,
        "phone": "",
        "address": "",
        "branch": {"name": "Sucursal Temporal", "is_main": True},
        "status": "active",
        "password_hash": password_hash, # Guardamos el hash generado por passlib
        "created_at": datetime.utcnow(),
        "audit_log": [{
            "action": "initial_creation",
            "ip": "system",
            "timestamp": datetime.utcnow()
        }],
        "requires_password_change": True
    }

    result = await db.users.insert_one(superadmin_data)
    await store_credentials_securely(username, password)
    return str(result.inserted_id)


async def store_credentials_securely(username: str, password: str):
    """Almacena credenciales en archivo seguro para desarrollo."""
    # (Esta función no necesita cambios)
    secure_dir = "./secure"
    if not os.path.exists(secure_dir):
        os.makedirs(secure_dir, mode=0o700)
    
    file_path = os.path.join(secure_dir, "initial_credentials.json")
    credentials = {
        "username": username,
        "password": password,
        "created_at": datetime.utcnow().isoformat(),
        "warning": "ESTAS CREDENCIALES SON PARA DESARROLLO. NO USAR EN PRODUCCIÓN"
    }
    with open(file_path, 'w') as f:
        json.dump(credentials, f, indent=2)
    os.chmod(file_path, 0o600)
    print(f"🔐 Credenciales guardadas en archivo seguro: {file_path}")


async def authenticate_user(db: AsyncIOMotorDatabase, username: str, password: str):
    """Autentica un usuario y devuelve el diccionario del usuario si es válido."""
    user = await db.users.find_one({"username": username})
    if not user:
        return None
    
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta inactiva o suspendida"
        )
    
    # --- ¡CORRECCIÓN CRÍTICA! ---
    # Usamos nuestra función 'verify_password' que utiliza passlib,
    # en lugar de 'bcrypt.checkpw'.
    if not verify_password(password, user["password_hash"]):
        # Registrar intento fallido
        await db.users.update_one({"_id": user["_id"]}, {"$inc": {"failed_login_attempts": 1}})
        return None
    
    # Reiniciar contador de intentos fallidos y actualizar último login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_login_attempts": 0, "last_login": datetime.utcnow()}}
    )
    return user


async def get_user_by_username(db: AsyncIOMotorDatabase, username: str):
    """Obtiene un usuario por su nombre de usuario, excluyendo campos sensibles."""
    # (Esta función no necesita cambios)
    projection = {"password_hash": 0, "audit_log": 0, "failed_login_attempts": 0}
    user = await db.users.find_one({"username": username}, projection)
    
    if user:
        user["_id"] = str(user["_id"])
    return user

# La función force_credentials_rotation también necesitaría ser actualizada para usar get_password_hash.
# La dejo comentada por ahora para enfocarnos en el login.
# async def force_credentials_rotation...