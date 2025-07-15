# /backend/app/main.py
# PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN FASTAPI

from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- SECCIÓN 1: IMPORTACIONES DEL NÚCLEO DE LA APLICACIÓN ---
# Dependencias centrales para la configuración, base de datos y seguridad.
from app.core.database import db, get_db
from app.core.config import settings

# --- SECCIÓN 2: IMPORTACIONES DE MÓDULOS DE NEGOCIO ---
# Importamos los routers desde sus respectivos módulos para registrarlos en la aplicación.
from app.modules.auth import auth_routes
from app.modules.inventory import product_routes
from app.modules.users import user_routes
from app.modules.roles import role_routes
from app.modules.crm import supplier_routes
# (Cuando crees los otros, los importarás aquí)
# from app.modules.crm import customer_routes
# from app.modules.purchasing import purchase_order_routes

# Importamos los servicios necesarios para las tareas de arranque.
from app.modules.auth import auth_service
from app.modules.roles import role_service

# --- SECCIÓN 3: INICIALIZACIÓN DE LA APLICACIÓN FASTAPI ---
# Se crea la instancia principal de la aplicación con metadatos del proyecto.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP PRO.",
    # La documentación interactiva (Swagger/Redoc) se deshabilita en producción por seguridad.
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# --- SECCIÓN 4: CONFIGURACIÓN DE MIDDLEWARE (CORS) ---
# Permite que el frontend (u otros orígenes definidos) se comunique de forma segura con esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.ALLOWED_ORIGINS] if settings.ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECCIÓN 5: LÓGICA DE CICLO DE VIDA DE LA APLICACIÓN (STARTUP/SHUTDOWN) ---
async def initialize_application(db_conn: AsyncIOMotorDatabase):
    """Función central para ejecutar tareas de arranque después de conectar a la base de datos."""
    print("--- Iniciando tareas de arranque de la aplicación ---")
    await role_service.initialize_roles(db_conn)
    
    existing_superadmin = await db_conn.users.find_one({"role": "superadmin"})
    if not existing_superadmin:
        print("🔧 No se encontró un superadmin. Creando uno nuevo...")
        await auth_service.create_secure_superadmin(db_conn)
    else:
        print("✅ Superadmin ya existe en la base de datos.")
    
    print("--- Tareas de arranque completadas ---")

@app.on_event("startup")
async def startup_event():
    """Se ejecuta una sola vez al iniciar el servidor para conectar a la base de datos."""
    try:
        await db.connect()
        await initialize_application(db.get_database())
    except Exception as e:
        print(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Se ejecuta una sola vez al apagar el servidor para cerrar la conexión de forma segura."""
    await db.close()

# --- SECCIÓN 6: ARQUITECTURA DE RUTAS (API ROUTER) ---
# Se agrupan todos los routers de los módulos bajo un prefijo común '/api'.
api_router = APIRouter(prefix="/api")

# Registro modular de routers
api_router.include_router(auth_routes.router)
api_router.include_router(product_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(role_routes.router)
api_router.include_router(supplier_routes.router)
# api_router.include_router(customer_routes.router)
# api_router.include_router(purchase_order_routes.router)

# Se incluye el router principal en la aplicación.
app.include_router(api_router)

# --- SECCIÓN 7: ENDPOINTS RAÍZ Y DE VERIFICACIÓN DE SALUD ---
@app.get("/", tags=["Root"])
async def read_root():
    """Endpoint raíz para una verificación rápida de que la API está en línea."""
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME}"}

@app.get("/health", tags=["System"])
async def health_check(db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Endpoint que verifica la salud del sistema, incluyendo la conectividad con la base de datos."""
    try:
        await db_conn.command("ping")
        return {
            "status": "healthy",
            "environment": settings.ENV,
            "database_connection": "ok",
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Servicio no disponible: Error de base de datos - {str(e)}"
        )