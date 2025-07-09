# /backend/app/services/auth_service.py
# CÓDIGO CORREGIDO Y REFACTORIZADO

import os
import bcrypt
import secrets
import json
from datetime import datetime
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import UserRole
from app.core.config import settings

# --- NO HAY IMPORTACIONES DE 'app.core.database' AQUÍ ---

async def create_secure_superadmin(db: AsyncIOMotorDatabase):
    """Crea un superadmin con credenciales generadas automáticamente."""
    existing_superadmin = await db.users.find_one({"role": UserRole.SUPERADMIN})
    if existing_superadmin:
        return None

    password = secrets.token_urlsafe(16)
    username = "initadmin_" + secrets.token_hex(4)
    
    password_hash = bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    superadmin_data = {
        "username": username,
        "name": "Administrador Inicial",
        "role": UserRole.SUPERADMIN,
        "phone": "",
        "address": "",
        "branch": {"name": "Sucursal Temporal", "is_main": True},
        "status": "active",
        "password_hash": password_hash,
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

async def force_credentials_rotation(db: AsyncIOMotorDatabase):
    """Fuerza la rotación de credenciales para cuentas privilegiadas."""
    if not settings.ENABLE_CREDENTIAL_ROTATION:
        return
    
    print("🔐 Iniciando rotación de credenciales privilegiadas...")
    privileged_roles = [UserRole.SUPERADMIN, UserRole.ADMIN]
    privileged_users_cursor = db.users.find({"role": {"$in": privileged_roles}})
    
    async for user in privileged_users_cursor:
        new_password = secrets.token_urlsafe(16)
        password_hash = bcrypt.hashpw(
            new_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_hash": password_hash, "requires_password_change": True}}
        )
        
        audit_log = {"action": "password_rotation", "ip": "system", "timestamp": datetime.utcnow()}
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$push": {"audit_log": audit_log}}
        )
        print(f"🔄 Credenciales rotadas para usuario: {user['username']}")
    print("✅ Rotación de credenciales completada")

async def authenticate_user(db: AsyncIOMotorDatabase, username: str, password: str):
    """Autentica un usuario y devuelve el usuario si es válido."""
    user = await db.users.find_one({"username": username})
    if not user:
        return None
    
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta inactiva o suspendida"
        )
    
    if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        await db.users.update_one({"_id": user["_id"]}, {"$inc": {"failed_login_attempts": 1}})
        return None
    
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"failed_login_attempts": 0, "last_login": datetime.utcnow()}})
    return user

async def get_user_by_username(db: AsyncIOMotorDatabase, username: str):
    """Obtiene un usuario por su nombre de usuario, excluyendo campos sensibles."""
    projection = {"password_hash": 0, "audit_log": 0, "failed_login_attempts": 0}
    user = await db.users.find_one({"username": username}, projection)
    
    if user:
        # Convertir ObjectId a str para evitar problemas de serialización JSON
        user["_id"] = str(user["_id"])
    return user