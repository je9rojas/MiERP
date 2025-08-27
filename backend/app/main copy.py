# /backend/app/main.py

"""
Punto de Entrada Principal y Orquestador de la Aplicación FastAPI.

Este archivo es el corazón de la API del backend. Sus responsabilidades clave son:
- Inicializar y configurar la instancia principal de la aplicación FastAPI.
- Establecer middlewares esenciales, como la seguridad de Cross-Origin
  Resource Sharing (CORS) para permitir la comunicación con el frontend.
- Gestionar el ciclo de vida de la aplicación, ejecutando tareas críticas durante el
  arranque (conexión a la base de datos, inicialización de datos) y el apagado.
- Registrar el router principal de la API con un prefijo versionado.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from contextlib import asynccontextmanager

# Se añade 'Request' para el tipado en el middleware de depuración.
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import db, get_db
from app.api import api_router
from app.modules.auth import auth_service
from app.modules.roles import role_service

# ==============================================================================
# SECCIÓN 2: CICLO DE VIDA DE LA APLICACIÓN (LIFESPAN)
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación, ejecutando tareas al inicio y al final.
    """
    logger.info("--- Iniciando Proceso de Arranque de la Aplicación ---")
    try:
        logger.info("Paso 1/3: Conectando a la base de datos MongoDB...")
        await db.connect()
        db_connection = db.get_database()
        
        logger.info("Paso 2/3: Verificando la conexión con el servidor (ping)...")
        await db_connection.command("ping")
        logger.info("Paso 2/3: Conexión a la base de datos verificada exitosamente. ✅")

        logger.info("Paso 3/3: Inicializando datos base (Roles y Superadmin)...")
        await role_service.initialize_roles(db_connection)
        await auth_service.create_secure_superadmin(db_connection)
        logger.info("Paso 3/3: Datos base inicializados y/o verificados. ✅")
        
        logger.info("--- Proceso de Arranque Completado. La Aplicación está Lista. ---")
    except Exception as e:
        logger.critical(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: La aplicación no pudo iniciarse.")
        logger.critical(f"Detalle del error: {e}")
        raise RuntimeError("Fallo en la inicialización de la aplicación.") from e
    
    yield
    
    logger.info("--- Iniciando Proceso de Apagado de la Aplicación ---")
    await db.close()
    logger.info("--- Conexión a la base de datos cerrada exitosamente. ---")

# ==============================================================================
# SECCIÓN 3: CONFIGURACIÓN DE LA APLICACIÓN
# ==============================================================================

logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP.",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url="/api/redoc" if settings.ENV == "development" else None,
    openapi_url="/api/v1/openapi.json"
)

# ==============================================================================
# SECCIÓN 4: MIDDLEWARE DE CORS
# ==============================================================================

if settings.ALLOWED_ORIGINS:
    logger.info(f"Entorno: '{settings.ENV}'. Configurando CORS para los orígenes: {settings.ALLOWED_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip() for origin in settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ==============================================================================
# SECCIÓN 4.5: MIDDLEWARE DE DEPURACIÓN DE PETICIONES
# ==============================================================================

# Este middleware se añade con el propósito específico de depurar problemas de
# conexión a bajo nivel. Se ejecutará para cada petición que llegue al servidor,
# ANTES de que sea procesada por la lógica de las rutas de FastAPI.
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    """
    Middleware para registrar los detalles de cada petición HTTP entrante.

    Su función es confirmar que las peticiones del frontend están llegando
    correctamente al servidor ASGI, lo que ayuda a diagnosticar si el problema
    es de red o de la lógica de la aplicación.
    """
    logging.info(f"--- Petición Entrante Detectada por Middleware ---")
    logging.info(f"  Host Origen: {request.client.host if request.client else 'N/A'}")
    logging.info(f"  Método HTTP: {request.method}")
    logging.info(f"  URL Destino: {request.url}")
    logging.info(f"-------------------------------------------------")
    
    response = await call_next(request)
    
    return response

# ==============================================================================
# SECCIÓN 5: REGISTRO DE RUTAS DE LA API
# ==============================================================================

app.include_router(api_router, prefix="/api/v1")
logger.info(f"Routers de la API v1 registrados exitosamente bajo el prefijo '/api/v1'.")

# ==============================================================================
# SECCIÓN 6: ENDPOINTS GLOBALES (RAÍZ Y VERIFICACIÓN DE SALUD)
# ==============================================================================

@app.get("/", tags=["Sistema"], include_in_schema=False)
async def read_root():
    """Endpoint raíz para una verificación básica de que el servicio está en línea."""
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}."}

@app.get("/health", tags=["Sistema"], summary="Verifica la salud del servicio")
async def health_check(database: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Endpoint de verificación de salud ('health check').

    Verifica la conectividad con servicios esenciales, como la base de datos.
    """
    try:
        await database.command("ping")
        db_status = "ok"
    except Exception:
        db_status = "error"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"database_connection": db_status}
        )
    
    return {
        "status": "healthy",
        "services": {
            "database_connection": db_status
        }
    }