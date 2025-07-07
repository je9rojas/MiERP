# /backend/app/main.py
# CÓDIGO COMPLETO, CORREGIDO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

import asyncio
from fastapi import FastAPI, HTTPException, APIRouter # <-- APIRouter importado
from fastapi.middleware.cors import CORSMiddleware

# Importar los módulos de rutas
from app.routes import auth, products, users, roles

# Importar lógica de negocio y configuración
from app.services.auth_service import create_secure_superadmin # Asumo que rotate_credentials_job está aquí también
from app.core.database import db_client
from app.core.config import settings
from app.models.user import UserRole

# Declaración de la tarea de rotación global (si la usas)
rotation_task = None 

app = FastAPI(
    title="MiERP API",
    version="1.0.0",
    # Mantenemos las docs bajo /api para consistencia
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# Configura CORS (sin cambios)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ARQUITECTURA DE RUTAS MODULAR (LA MEJOR PRÁCTICA) ---

# 1. Se crea un router principal que agrupará todas las rutas bajo el prefijo "/api".
#    Esto se alinea perfectamente con la `baseURL` de tu frontend en Axios.
api_router = APIRouter(prefix="/api")

# 2. Se incluyen los routers de cada módulo DENTRO de este router principal.
#    FastAPI ahora combinará el prefijo "/api" con el prefijo de cada módulo.
#    Ejemplo para products: "/api" + "/products" = "/api/products"
#    Ya no se necesita definir el prefijo completo en cada línea.
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)

# 3. Se incluye el router principal en la aplicación.
#    Todas las rutas de la API estarán ahora bajo /api.
app.include_router(api_router)


# --- Lógica de Inicialización (sin cambios funcionales) ---

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

# Si tienes una función rotate_credentials_job, ponla aquí.

@app.on_event("startup")
async def startup_event():
    global rotation_task
    try:
        await db_client.connect()
        await initialize_roles()
        
        if not await db_client.db.users.find_one({"role": "superadmin"}):
            superadmin_id = await create_secure_superadmin()
            if superadmin_id:
                print(f"✅ Superadmin seguro creado con ID: {superadmin_id}")
            else:
                print("⚠️ No se pudo crear el superadmin")
        else:
            print("✅ Superadmin ya existe en la base de datos")
        
        # if settings.ENABLE_CREDENTIAL_ROTATION:
        #     rotation_task = asyncio.create_task(rotate_credentials_job())
        #     print("🔄 Tarea de rotación de credenciales iniciada")
    except Exception as e:
        print(f"❌ Error durante la inicialización: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    global rotation_task
    if rotation_task and not rotation_task.done():
        rotation_task.cancel()
        try:
            await rotation_task
        except asyncio.CancelledError:
            pass
    
    await db_client.close()
    print("❌ Desconectado de MongoDB Atlas")

# --- Rutas Raíz y de Salud (fuera del prefijo /api) ---

@app.get("/")
def read_root():
    return {"message": "MiERP API - Sistema de Gestión Empresarial"}

@app.get("/health") # Cambiado de /api/health para que no entre en conflicto
async def health_check():
    """Endpoint de verificación de salud del sistema"""
    try:
        await db_client.db.command("ping")
        return {
            "status": "healthy",
            "environment": settings.ENV,
            "database": "connected",
            # "credential_rotation": "active" if rotation_task and not rotation_task.done() else "inactive"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Service unavailable: {str(e)}"
        )