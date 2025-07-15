import os
import bcrypt
import secrets
import json
from datetime import datetime
from fastapi import HTTPException, status
from app.models.user import UserRole
from app.core.database import db_client
from app.core.config import settings

async def create_secure_superadmin():
    """Crea un superadmin con credenciales generadas automáticamente"""
    existing_superadmin = await db_client.db.users.find_one({"role": UserRole.SUPERADMIN})
    if existing_superadmin:
        return None

    # Generar credenciales seguras
    password = secrets.token_urlsafe(16)
    username = "initadmin_" + secrets.token_hex(4)
    
    # Hashear contraseña
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
        "branch": {"name": "Temporal", "is_main": True},
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

    result = await db_client.db.users.insert_one(superadmin_data)
    
    # Solo usar almacenamiento en archivo para desarrollo
    await store_in_secure_file(username, password)
    
    return str(result.inserted_id)

async def store_credentials_securely(username: str, password: str):
    """Almacena credenciales en archivo local (solo desarrollo)"""
    await store_in_secure_file(username, password)

async def store_in_secure_file(username: str, password: str):
    """Almacena en archivo seguro (solo para desarrollo)"""
    secure_dir = "./secure"
    if not os.path.exists(secure_dir):
        os.makedirs(secure_dir, mode=0o700)
    
    file_path = os.path.join(secure_dir, "initial_credentials.json")
    with open(file_path, 'w') as f:
        json.dump({
            "username": username,
            "password": password,
            "created_at": datetime.utcnow().isoformat()
        }, f)
    
    os.chmod(file_path, 0o600)
    print(f"🔐 Credenciales guardadas en archivo seguro: {file_path}")
    print(f"⚠️ ADVERTENCIA: Esto es solo para desarrollo. No usar en producción")


async def force_credentials_rotation():
    """Fuerza la rotación de credenciales para cuentas privilegiadas"""
    privileged_roles = [UserRole.SUPERADMIN, UserRole.ADMIN]
    privileged_users = db_client.db.users.find({"role": {"$in": privileged_roles}})
    
    async for user in privileged_users:
        # Generar nueva contraseña segura
        new_password = secrets.token_urlsafe(16)
        password_hash = bcrypt.hashpw(
            new_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Actualizar en base de datos
        await db_client.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "password_hash": password_hash,
                "requires_password_change": True
            }}
        )
        
        # Almacenar nueva credencial de forma segura
        await store_credentials_securely(user["username"], new_password)
        
        # Registrar auditoría
        audit_log = {
            "action": "password_rotation",
            "ip": "system",
            "timestamp": datetime.utcnow()
        }
        await db_client.db.users.update_one(
            {"_id": user["_id"]},
            {"$push": {"audit_log": audit_log}}
        )
    
    print(f"✅ Rotación de credenciales completada para cuentas privilegiadas")

async def authenticate_user(username: str, password: str):
    """Autentica un usuario y devuelve el usuario si es válido"""
    user = await db_client.db.users.find_one({"username": username})
    if not user:
        return None
    
    # Verificar estado de la cuenta
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta inactiva o suspendida"
        )
    
    # Verificar contraseña
    if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        # Registrar intento fallido
        await db_client.db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"failed_login_attempts": 1}}
        )
        return None
    
    # Reiniciar contador de intentos fallidos
    await db_client.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_login_attempts": 0}}
    )
    
    # Actualizar último login
    await db_client.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return user