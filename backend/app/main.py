# /backend/app/main.py

"""
Punto de Entrada Principal y Orquestador de la Aplicación FastAPI.

Este archivo es el corazón de la API del backend. Sus responsabilidades clave son:
- Inicializar y configurar la instancia principal de la aplicación FastAPI.
- Establecer middlewares esenciales, con un enfoque principal en la seguridad de
  Cross-Origin Resource Sharing (CORS) para permitir la comunicación con el frontend.
- Gestionar el ciclo de vida de la aplicación, ejecutando tareas críticas durante el
  arranque (conexión a la base de datos, inicialización de datos) y el apagado.
- Registrar el router principal de la API con un prefijo versionado.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

# Importaciones del núcleo de la aplicación
from app.core.config import settings
from app.core.database import db, get_db
from app.api import api_router

# Importaciones de servicios para el ciclo de vida de la aplicación
from app.modules.auth import auth_service
from app.modules.roles import role_service

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DE LOGGING Y DE LA APLICACIÓN
# ==============================================================================

# Configura el logging para que muestre información útil en la consola.
logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logger = logging.getLogger(__name__)

# Crea la instancia principal de la aplicación FastAPI.
# La configuración (título, versión, etc.) se carga desde el módulo de configuración.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP PRO.",
    # Oculta la documentación de la API (Swagger UI, ReDoc) en el entorno de producción.
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url="/api/redoc" if settings.ENV == "development" else None
)


# ==============================================================================
# SECCIÓN 3: MIDDLEWARE DE CORS
# ==============================================================================

# Configura el middleware de CORS si se han definido orígenes permitidos.
# Esto es crucial para permitir que el frontend se comunique con esta API.
if settings.ALLOWED_ORIGINS:
    logger.info(f"Entorno: '{settings.ENV}'. Configurando CORS para los orígenes: {settings.ALLOWED_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,  # Orígenes permitidos leídos desde la configuración
        allow_credentials=True,
        allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, etc.)
        allow_headers=["*"],  # Permite todas las cabeceras HTTP
    )

# ==============================================================================
# SECCIÓN 4: EVENTOS DEL CICLO DE VIDA DE LA APLICACIÓN
# ==============================================================================

@app.on_event("startup")
async def startup_event_handler():
    """
    Ejecuta tareas críticas cuando la aplicación se inicia.
    Esto incluye la conexión a la base de datos y la inicialización de datos base.
    """
    logger.info("--- Iniciando Proceso de Arranque de la Aplicación ---")
    try:
        logger.info("Paso 1/3: Conectando a la base de datos MongoDB...")
        await db.connect()
        db_connection = db.get_database()
        
        logger.info("Paso 2/3: Verificando la conexión con el servidor de la base de datos (ping)...")
        await db_connection.command("ping")
        logger.info("Paso 2/3: Conexión a la base de datos verificada exitosamente. ✅")

        logger.info("Paso 3/3: Inicializando datos base (Roles y Superadmin)...")
        await role_service.initialize_roles(db_connection)
        await auth_service.create_secure_superadmin(db_connection)
        logger.info("Paso 3/3: Datos base inicializados y/o verificados. ✅")
        
        logger.info("--- Proceso de Arranque Completado. La Aplicación está Lista. ---")
    except Exception as error:
        logger.critical(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: La aplicación no pudo iniciarse.")
        logger.critical(f"Detalle del error: {str(error)}")
        # Levanta la excepción para que el proceso de la aplicación se detenga.
        raise

@app.on_event("shutdown")
async def shutdown_event_handler():
    """
    Ejecuta tareas de limpieza cuando la aplicación se apaga.
    Principalmente, cierra la conexión con la base de datos.
    """
    logger.info("--- Iniciando Proceso de Apagado de la Aplicación ---")
    await db.close()
    logger.info("--- Conexión a la base de datos cerrada exitosamente. ---")


# ==============================================================================
# SECCIÓN 5: REGISTRO DE RUTAS DE LA API
# ==============================================================================

# Incluye todas las rutas definidas en el router principal de la API,
# asignando el prefijo global y versionado "/api/v1".
app.include_router(api_router, prefix="/api/v1")
logger.info("Routers de la API v1 registrados exitosamente bajo el prefijo '/api/v1'.")


# ==============================================================================
# SECCIÓN 6: ENDPOINTS GLOBALES (RAÍZ Y VERIFICACIÓN DE SALUD)
# ==============================================================================

@app.get("/", tags=["Sistema"], include_in_schema=False)
async def read_root():
    """Endpoint raíz para una verificación básica de que el servicio está en línea."""
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME}. El servicio está operativo."}

@app.get("/health", tags=["Sistema"], summary="Verifica la salud del servicio")
async def health_check(database: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Endpoint de verificación de salud ('health check').
    Comprueba el estado de la aplicación y la conexión a la base de datos.
    Esencial para sistemas de monitoreo y balanceadores de carga.
    """
    try:
        await database.command("ping")
        database_status = "ok"
    except Exception as e:
        logger.error(f"Error en el Health Check de la base de datos: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Servicio no disponible: No se pudo conectar a la base de datos."
        )
    
    return {
        "status": "healthy",
        "environment": settings.ENV,
        "database_connection": database_status
    }