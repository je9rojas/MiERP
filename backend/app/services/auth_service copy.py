# backend/app/services/auth_service.py (versión segura)

import os
import bcrypt
import secrets
import string
from datetime import datetime
from fastapi import HTTPException, status
from app.models.user import UserDB, UserRole
from app.core.database import db_client
from app.core.security import create_access_token
from app.core.config import settings

async def create_secure_superadmin():
    """Crea un superadmin con credenciales generadas automáticamente y almacenadas de forma segura"""
    existing_superadmin = await db_client.db.users.find_one({"role": UserRole.SUPERADMIN})
    if existing_superadmin:
        return None

    # Generar credenciales seguras
    password = secrets.token_urlsafe(16)  # Contraseña de 16 caracteres aleatorios
    username = "initadmin_" + secrets.token_hex(4)  # Nombre de usuario temporal
    
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
        "requires_password_change": True  # Obligar a cambiar contraseña
    }

    result = await db_client.db.users.insert_one(superadmin_data)
    
    # Guardar credenciales en sistema seguro (no en logs!)
    store_credentials_securely(username, password)
    
    return str(result.inserted_id)

def store_credentials_securely(username: str, password: str):
    """Almacena credenciales en un sistema seguro (AWS Secrets Manager, HashiCorp Vault, etc.)"""
    # Implementar según infraestructura de la empresa
    if settings.ENV == "development":
        # Solo para desarrollo: guardar en archivo seguro con permisos restringidos
        with open('/secure/initial_credentials.txt', 'w') as f:
            f.write(f"Usuario: {username}\nContraseña: {password}")
        os.chmod('/secure/initial_credentials.txt', 0o600)
    else:
        # En producción usar servicio profesional de gestión de secretos
        # Ejemplo para AWS Secrets Manager:
        # secrets_manager = boto3.client('secretsmanager')
        # secrets_manager.create_secret(Name='superadmin-initial-creds', SecretString=json.dumps({'username':username,'password':password}))
        pass

async def authenticate_user(username: str, password: str):
    """Autentica un usuario y devuelve el usuario si es válido"""
    user = await db_client.db.users.find_one({"username": username})
    if not user:
        return None
    
    if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        return None
    
    # Actualizar último login
    await db_client.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return user