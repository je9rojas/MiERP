# /backend/app/main.py

import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# --- MODIFICACIÓN: Importar los nuevos routers ---
from app.routes import auth, products, users, roles
from app.services.auth_service import create_secure_superadmin, force_credentials_rotation
from app.core.database import db_client
from app.core.config import settings
from app.models.user import UserRole # Importar UserRole

app = FastAPI(
    title="MiERP API",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODIFICACIÓN: Incluir los nuevos routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"]) # Ajustado prefijo
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(users.router, prefix="/api/users", tags=["Users Management"])
app.include_router(roles.router, prefix="/api/roles", tags=["Roles Management"])


# --- NUEVA FUNCIÓN: Para inicializar roles ---
async def initialize_roles():
    """Verifica y crea los roles base si no existen en la base de datos."""
    print("🔄 Verificando roles base en la base de datos...")
    try:
        for role in UserRole:
            role_name = role.value
            existing_role = await db_client.db.roles.find_one({"name": role_name})
            if not existing_role:
                role_data = {
                    "name": role_name,
                    "description": f"Rol para {role_name.capitalize()}"
                }
                await db_client.db.roles.insert_one(role_data)
                print(f"✅ Rol '{role_name}' creado.")
        print("✅ Verificación de roles completada.")
    except Exception as e:
        print(f"❌ Error al inicializar roles: {e}")

# ... (El resto de tu archivo, como `rotate_credentials_job`, se mantiene igual) ...
# Pega tu función rotate_credentials_job() aquí.

# ...

@app.on_event("startup")
async def startup_event():
    global rotation_task
    try:
        await db_client.connect()
        
        # --- MODIFICACIÓN: Llamar a la inicialización de roles ---
        await initialize_roles()
        
        if not await db_client.db.users.find_one({"role": "superadmin"}):
            superadmin_id = await create_secure_superadmin()
            if superadmin_id:
                print(f"✅ Superadmin seguro creado con ID: {superadmin_id}")
            else:
                print("⚠️ No se pudo crear el superadmin")
        else:
            print("✅ Superadmin ya existe en la base de datos")
        
        if settings.ENABLE_CREDENTIAL_ROTATION:
            rotation_task = asyncio.create_task(rotate_credentials_job())
            print("🔄 Tarea de rotación de credenciales iniciada")
    except Exception as e:
        print(f"❌ Error durante la inicialización: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    global rotation_task
    # Cancelar tarea de rotación si está activa
    if rotation_task and not rotation_task.done():
        rotation_task.cancel()
        try:
            await rotation_task
        except asyncio.CancelledError:
            pass
    
    # Cerrar conexión a la base de datos
    await db_client.close()
    print("❌ Desconectado de MongoDB Atlas")

@app.get("/")
def read_root():
    return {"message": "MiERP API - Sistema de Gestión Empresarial"}

@app.get("/api/health")
async def health_check():
    """Endpoint de verificación de salud del sistema"""
    try:
        # Verificar conexión a la base de datos
        await db_client.db.command("ping")
        
        return {
            "status": "healthy",
            "environment": settings.ENV,
            "database": "connected",
            "credential_rotation": "active" if rotation_task and not rotation_task.done() else "inactive"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Service unavailable: {str(e)}"
        )