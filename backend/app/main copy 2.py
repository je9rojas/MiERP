# /backend/app/main.py
# PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN, REFACTORIZADO PARA ARQUITECTURA MODULAR

from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase


# --- SECCIÓN 1: IMPORTACIONES CENTRALES ---

# Dependencias del núcleo de la aplicación
from app.core.database import db, get_db
from app.core.config import settings

# --- ¡IMPORTACIONES DE MÓDULOS! ---
# Importamos los archivos de rutas desde sus respectivos módulos.
# Usar alias (ej. 'as auth_router') es una buena práctica para evitar conflictos de nombres.
from app.modules.auth import auth_routes as auth_router
from app.modules.inventory import product_routes as product_router
from app.modules.users import user_routes as user_router
from app.modules.roles import role_routes as role_router
from app.modules.crm import supplier_routes as supplier_router

# Descomenta estas líneas a medida que vayas creando los módulos
# from app.modules.purchasing import purchase_order_routes as purchase_order_router
# from app.modules.crm import customer_routes as customer_router, supplier_routes as supplier_router

# Importamos los servicios necesarios para la inicialización
from app.modules.auth import auth_service
from app.modules.roles import role_service


# --- SECCIÓN 2: INICIALIZACIÓN DE LA APLICACIÓN FASTAPI ---

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="La API backend para el sistema de gestión empresarial MiERP PRO.",
    # Oculta la documentación interactiva en entornos de producción por seguridad
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# --- SECCIÓN 3: CONFIGURACIÓN DE MIDDLEWARE (CORS) ---

# Permite que el frontend (u otros orígenes definidos) se comunique con esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.ALLOWED_ORIGINS] if settings.ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- SECCIÓN 4: LÓGICA DE CICLO DE VIDA DE LA APLICACIÓN ---

async def initialize_application(db_conn: AsyncIOMotorDatabase):
    """
    Función central para ejecutar tareas de arranque después de conectar a la DB.
    """
    print("--- Iniciando tareas de arranque de la aplicación ---")
    await role_service.initialize_roles(db_conn)
    
    existing_superadmin = await db_conn.users.find_one({"role": "superadmin"})
    if not existing_superadmin:
        print("🔧 No se encontró un superadmin. Creando uno nuevo...")
        superadmin_id = await auth_service.create_secure_superadmin(db_conn)
        if superadmin_id:
            print(f"✅ Superadmin seguro creado con ID: {superadmin_id}")
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
    """Se ejecuta una sola vez al apagar el servidor para cerrar la conexión."""
    await db.close()


# --- SECCIÓN 5: ARQUITECTURA DE RUTAS (API ROUTER) ---

# Creamos un router principal para agrupar todas las rutas bajo el prefijo "/api".
api_router = APIRouter(prefix="/api")

# Incluimos los routers de cada módulo DENTRO de este router principal.
api_router.include_router(auth_router.router)
api_router.include_router(product_router.router)
api_router.include_router(user_router.router)
api_router.include_router(role_router.router)
# api_router.include_router(purchase_order_router.router) # Descomentar cuando esté listo
# api_router.include_router(customer_router.router) # Descomentar cuando esté listo
api_router.include_router(supplier_router.router) # Descomentar cuando esté listo

# Finalmente, incluimos el router principal en la aplicación.
app.include_router(api_router)


# --- SECCIÓN 6: RUTAS RAÍZ Y DE VERIFICACIÓN DE SALUD ---

@app.get("/", tags=["Root"])
async def read_root():
    """Endpoint raíz para una verificación rápida de que la API está en línea."""
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME}"}

@app.get("/health", tags=["System"])
async def health_check(db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Endpoint que verifica la salud del sistema, incluyendo la conexión a la base de datos."""
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