# /backend/app/main.py

"""
Punto de entrada principal y orquestador de la aplicación FastAPI.
Este archivo es responsable de:
- Inicializar la aplicación FastAPI.
- Configurar middlewares como CORS.
- Incluir los routers de todos los módulos de negocio.
- Manejar el ciclo de vida de la aplicación (startup y shutdown) con logging robusto.
"""

# --- SECCIÓN 1: IMPORTACIONES ---
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import db, get_db
from app.core.config import settings

from app.modules.auth import auth_routes, auth_service
from app.modules.inventory import product_routes
from app.modules.users import user_routes
from app.modules.roles import role_routes, role_service
from app.modules.crm import supplier_routes, customer_routes
from app.modules.data_management import data_management_routes
from app.modules.purchasing import purchasing_routes

# --- SECCIÓN 2: CONFIGURACIÓN INICIAL ---

# Se configura el logging para obtener información detallada en la consola.
logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logger = logging.getLogger(__name__)

# Se crea la instancia principal de la aplicación.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP PRO.",
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)


# --- SECCIÓN 3: CONFIGURACIÓN DE MIDDLEWARES ---

if settings.ALLOWED_ORIGINS:
    logger.info(f"Configurando CORS para los siguientes orígenes: {settings.ALLOWED_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --- SECCIÓN 4: INCLUSIÓN DE RUTAS MODULARES ---

logger.info("Registrando los routers de los módulos de la aplicación...")
# Cada router se incluye con el prefijo global '/api' para mantener las URLs consistentes.
app.include_router(auth_routes.router, prefix="/api")
app.include_router(product_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(role_routes.router, prefix="/api")
app.include_router(supplier_routes.router, prefix="/api")
app.include_router(customer_routes.router, prefix="/api")
app.include_router(data_management_routes.router, prefix="/api")
app.include_router(purchasing_routes.router, prefix="/api")
logger.info("Todos los routers han sido registrados exitosamente. ✅")


# --- SECCIÓN 5: LÓGICA DE CICLO DE VIDA DE LA APLICACIÓN (STARTUP/SHUTDOWN) ---

@app.on_event("startup")
async def startup_event():
    """
    Se ejecuta una sola vez al iniciar la aplicación. Conecta a la base de datos
    y ejecuta tareas de inicialización con logging detallado para depuración.
    """
    logger.info("--- Iniciando el proceso de arranque de la aplicación ---")
    
    try:
        logger.info("Paso 1/4: Intentando conectar a la base de datos MongoDB...")
        await db.connect()
        db_conn = db.get_database()
        logger.info("Paso 1/4: Conexión al cliente de MongoDB establecida.")
        
        logger.info("Paso 2/4: Verificando la conexión con el servidor de la base de datos (ping)...")
        await db_conn.command("ping")
        logger.info("Paso 2/4: Conexión a la base de datos verificada exitosamente. ✅")
        
        logger.info("Paso 3/4: Inicializando roles del sistema...")
        await role_service.initialize_roles(db_conn)
        logger.info("Paso 3/4: Roles inicializados/verificados. ✅")
        
        logger.info("Paso 4/4: Verificando/creando usuario superadmin...")
        await auth_service.create_secure_superadmin(db_conn)
        logger.info("Paso 4/4: Usuario superadmin verificado/creado. ✅")
        
        logger.info("--- Proceso de arranque completado exitosamente. La aplicación está lista. ---")
    
    except Exception as e:
        logger.critical(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: No se pudo iniciar la aplicación.")
        logger.critical(f"El error ocurrió en la etapa de inicialización. Detalle: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cierra la conexión a la base de datos de forma segura al detener la aplicación."""
    logger.info("--- Cerrando la conexión a la base de datos... ---")
    await db.close()


# --- SECCIÓN 6: ENDPOINTS RAÍZ Y DE VERIFICACIÓN DE SALUD ---

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