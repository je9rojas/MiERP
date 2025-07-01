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
        "branch": {"name": "Sucursal Temporal", "is_main": True},
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
    
    # Guardar credenciales en archivo seguro (solo desarrollo)
    await store_credentials_securely(username, password)
    
    return str(result.inserted_id)

async def store_credentials_securely(username: str, password: str):
    """Almacena credenciales en archivo seguro para desarrollo"""
    secure_dir = "./secure"
    if not os.path.exists(secure_dir):
        os.makedirs(secure_dir, mode=0o700)
    
    file_path = os.path.join(secure_dir, "initial_credentials.json")
    
    # Crear estructura de datos segura
    credentials = {
        "username": username,
        "password": password,
        "created_at": datetime.utcnow().isoformat(),
        "warning": "ESTAS CREDENCIALES SON PARA DESARROLLO. NO USAR EN PRODUCCIÓN"
    }
    
    with open(file_path, 'w') as f:
        json.dump(credentials, f, indent=2)
    
    os.chmod(file_path, 0o600)  # Permisos: solo propietario puede leer/escribir
    print(f"🔐 Credenciales guardadas en archivo seguro: {file_path}")
    print("⚠️ ADVERTENCIA: Este método es solo para desarrollo. En producción, use un gestor de secretos profesional.")

async def force_credentials_rotation():
    """Fuerza la rotación de credenciales para cuentas privilegiadas"""
    # Solo ejecutar si está habilitado en configuración
    if not settings.ENABLE_CREDENTIAL_ROTATION:
        print("🔇 Rotación de credenciales deshabilitada por configuración")
        return
    
    print("🔐 Iniciando rotación de credenciales privilegiadas...")
    
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
        
        print(f"🔄 Credenciales rotadas para usuario: {user['username']}")
    
    print("✅ Rotación de credenciales completada")

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

async def get_user_by_username(username: str):
    """Obtiene un usuario por su nombre de usuario, excluyendo campos sensibles"""
    # Proyección para excluir campos sensibles
    projection = {
        "_id": 0,  # Excluir ID interno de MongoDB
        "password_hash": 0,
        "audit_log": 0,
        "failed_login_attempts": 0
    }
    
    user = await db_client.db.users.find_one(
        {"username": username},
        projection
    )
    
    if not user:
        return None
    
    # Asegurar que los campos requeridos estén presentes
    required_fields = ["username", "name", "role"]
    for field in required_fields:
        if field not in user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Campo requerido '{field}' no encontrado en usuario"
            )
    
    return user