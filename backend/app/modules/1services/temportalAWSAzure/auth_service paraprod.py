import os
import bcrypt
import secrets
import json
import boto3
import hvac
from datetime import datetime
from fastapi import HTTPException, status
from app.models.user import UserRole
from app.core.database import db_client
from app.core.config import settings
from botocore.exceptions import ClientError

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
    
    # Guardar credenciales en sistema seguro
    await store_credentials_securely(username, password)
    
    return str(result.inserted_id)

async def store_credentials_securely(username: str, password: str):
    """Almacena credenciales en un sistema seguro basado en configuración"""
    secret_data = json.dumps({
        "username": username,
        "password": password,
        "created_at": datetime.utcnow().isoformat()
    })
    
    try:
        if settings.SECRETS_MANAGER == "aws":
            await store_in_aws_secrets_manager(secret_data)
        elif settings.SECRETS_MANAGER == "azure":
            await store_in_azure_key_vault(secret_data)
        elif settings.SECRETS_MANAGER == "vault":
            await store_in_hashicorp_vault(secret_data)
        else:
            await store_in_secure_file(secret_data)
    except Exception as e:
        # En producción, esto debería enviarse a un sistema de monitoreo
        print(f"❌ Error crítico almacenando credenciales: {str(e)}")
        raise RuntimeError("No se pudo almacenar las credenciales de forma segura")

async def store_in_aws_secrets_manager(secret_data: str):
    """Almacena en AWS Secrets Manager"""
    secret_name = "superadmin-initial-creds"
    region_name = settings.SECRETS_MANAGER_CONFIG.get("region", "us-east-1")
    
    try:
        client = boto3.client(
            'secretsmanager',
            region_name=region_name,
            aws_access_key_id=settings.SECRETS_MANAGER_CONFIG.get("access_key"),
            aws_secret_access_key=settings.SECRETS_MANAGER_CONFIG.get("secret_key")
        )
        
        response = client.create_secret(
            Name=secret_name,
            SecretString=secret_data
        )
        print(f"🔐 Credenciales guardadas en AWS Secrets Manager: {response['ARN']}")
    except ClientError as e:
        print(f"❌ Error AWS Secrets Manager: {e.response['Error']['Message']}")
        raise

async def store_in_azure_key_vault(secret_data: str):
    """Almacena en Azure Key Vault"""
    from azure.identity import DefaultAzureCredential
    from azure.keyvault.secrets import SecretClient
    
    vault_url = settings.SECRETS_MANAGER_CONFIG.get("vault_url")
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=vault_url, credential=credential)
    
    secret_name = "superadmin-initial-creds"
    secret = client.set_secret(secret_name, secret_data)
    print(f"🔐 Credenciales guardadas en Azure Key Vault: {secret.id}")

async def store_in_hashicorp_vault(secret_data: str):
    """Almacena en HashiCorp Vault"""
    client = hvac.Client(
        url=settings.SECRETS_MANAGER_CONFIG.get("vault_url"),
        token=settings.SECRETS_MANAGER_CONFIG.get("vault_token")
    )
    
    secret_path = "secret/data/superadmin-initial-creds"
    response = client.secrets.kv.v2.create_or_update_secret(
        path=secret_path,
        secret=json.loads(secret_data)
    )
    print(f"🔐 Credenciales guardadas en HashiCorp Vault: {response['request_id']}")

async def store_in_secure_file(secret_data: str):
    """Almacena en archivo seguro (solo para desarrollo)"""
    secure_dir = "./secure"
    if not os.path.exists(secure_dir):
        os.makedirs(secure_dir, mode=0o700)
    
    file_path = os.path.join(secure_dir, "initial_credentials.json")
    with open(file_path, 'w') as f:
        f.write(secret_data)
    
    os.chmod(file_path, 0o600)
    print(f"🔐 Credenciales guardadas en archivo seguro: {file_path}")

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