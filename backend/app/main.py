# /backend/app/main.py
# PUNTO DE ENTRADA PRINCIPAL Y ORQUESTADOR DE LA APLICACIÓN FASTAPI

from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- SECCIÓN 1: IMPORTACIONES DEL NÚCLEO DE LA APLICACIÓN ---
from app.core.database import db, get_db
from app.core.config import settings

# --- SECCIÓN 2: IMPORTACIONES DE MÓDULOS DE NEGOCIO ---
# Se importan los routers y servicios de cada módulo funcional.
from app.modules.auth import auth_routes, auth_service
from app.modules.inventory import product_routes
from app.modules.users import user_routes
from app.modules.roles import role_routes, role_service
from app.modules.crm import supplier_routes, customer_routes
from app.modules.purchasing import purchase_order_routes
from app.modules.data_management import data_management_routes

# --- SECCIÓN 3: INICIALIZACIÓN Y CONFIGURACIÓN DE FASTAPI ---
# Se crea la instancia principal de la aplicación.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP PRO.",
    # La documentación interactiva se muestra solo en el entorno de desarrollo.
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# Configuración del Middleware de CORS para permitir la comunicación con el frontend.
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- SECCIÓN 4: ARQUITECTURA DE RUTAS (API ROUTER) ---
# Se crea un router principal para agrupar todos los endpoints bajo el prefijo común /api.
# Este enfoque permite una organización modular y limpia.
api_router = APIRouter()

# Registro de todos los routers de los módulos.
# De acuerdo a la estructura definida, este router principal NO añade prefijos adicionales.
# Cada módulo es responsable de su propio prefijo (ej. /auth, /products).
api_router.include_router(auth_routes.router)
api_router.include_router(product_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(role_routes.router)
api_router.include_router(supplier_routes.router)
api_router.include_router(customer_routes.router)
api_router.include_router(purchase_order_routes.router)
api_router.include_router(data_management_routes.router)

# Se monta el router principal en la aplicación bajo el prefijo /api.
# Todas las rutas definidas en los módulos ahora comenzarán con /api.
app.include_router(api_router, prefix="/api")

# --- SECCIÓN 5: LÓGICA DE CICLO DE VIDA DE LA APLICACIÓN (STARTUP/SHUTDOWN) ---
# Estas funciones se ejecutan automáticamente al iniciar y detener el servidor.

@app.on_event("startup")
async def startup_event():
    """Conecta a la base de datos y ejecuta tareas de inicialización."""
    print("--- Conectando a la base de datos... ---")
    try:
        await db.connect()
        db_conn = db.get_database()
        
        print("--- Iniciando tareas de arranque de la aplicación ---")
        await role_service.initialize_roles(db_conn)
        
        existing_superadmin = await db_conn.users.find_one({"role": "superadmin"})
        if not existing_superadmin:
            print("🔧 No se encontró un superadmin. Creando uno nuevo...")
            await auth_service.create_secure_superadmin(db_conn)
        else:
            print("✅ Superadmin ya existe en la base de datos.")
        
        print("--- Tareas de arranque completadas ---")
    except Exception as e:
        print(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cierra la conexión a la base de datos de forma segura."""
    print("--- Cerrando la conexión a la base de datos... ---")
    await db.close()

# --- SECCIÓN 6: ENDPOINTS RAÍZ Y DE VERIFICACIÓN DE SALUD ---
# Estos endpoints se definen directamente en `app` para que no tengan el prefijo /api.

@app.get("/", tags=["Root"], include_in_schema=False)
async def read_root():
    """Endpoint raíz para verificar que la API está en línea."""
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME}"}

@app.get("/health", tags=["Sistema"])
async def health_check(db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Verifica la salud del servicio y la conexión con la base de datos."""
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

"""
### Resumen de los Cambios Clave:

1.  **Eliminación de Prefijos y Tags:** En la **Sección 4**, he modificado todas las líneas `api_router.include_router(...)`. He eliminado los parámetros `prefix` y `tags`.
    *   **Antes:** `api_router.include_router(auth_routes.router, prefix="/auth", tags=["Autenticación"])`
    *   **Ahora:** `api_router.include_router(auth_routes.router)`

2.  **Responsabilidad Clara:** El código ahora refleja claramente tu estructura deseada. `main.py` solo se encarga de agrupar todos los routers bajo el prefijo `/api`. Cada archivo de rutas individual (`auth_routes.py`, `product_routes.py`, etc.) es responsable de definir su propio prefijo de módulo (ej. `/auth`).

Con esta versión de `main.py`, y asumiendo que tus archivos de rutas tienen sus prefijos definidos (ej. `router = APIRouter(prefix="/auth", ...)`), el sistema funcionará perfectamente y los errores 404 desaparecerán. Has mantenido tu estructura y el código sigue siendo limpio, profesional y mantenible.

"""