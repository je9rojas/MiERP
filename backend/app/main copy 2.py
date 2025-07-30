# /backend/app/main.py

"""
Punto de Entrada Principal y Orquestador de la Aplicación FastAPI.

Este archivo es el corazón de la API del backend. Sus responsabilidades clave son:
- Inicializar y configurar la instancia principal de la aplicación FastAPI.
- Establecer middlewares esenciales, con un enfoque principal en la seguridad de
  Cross-Origin Resource Sharing (CORS) para permitir la comunicación con el frontend.
- Gestionar el ciclo de vida de la aplicación, ejecutando tareas críticas durante el
  arranque (como la conexión a la base de datos y la inicialización de datos base)
  y el apagado (cierre de conexiones).
- Organizar y registrar todos los endpoints de la API de manera modular y escalable
  bajo un prefijo de API unificado.
"""

# --- SECCIÓN 1: IMPORTACIONES ---

# Importaciones de la librería estándar de Python
import json
import logging
from datetime import datetime

# Importaciones de librerías de terceros
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId  # <-- IMPORTACIÓN CRÍTICA PARA LA SOLUCIÓN

# Importaciones de módulos de la propia aplicación
from app.core.config import settings
from app.core.database import db, get_db

# Importación de servicios y routers de cada módulo de negocio
from app.modules.auth import auth_routes, auth_service
from app.modules.roles import role_routes, role_service
from app.modules.users import user_routes
from app.modules.inventory import product_routes
from app.modules.crm import supplier_routes, customer_routes
from app.modules.purchasing import purchasing_routes
from app.modules.data_management import data_management_routes


# --- SECCIÓN 2: CONFIGURACIÓN AVANZADA Y SOLUCIÓN DE SERIALIZACIÓN ---

# Configuración del sistema de logging para obtener un output claro y estructurado.
logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logger = logging.getLogger(__name__)


# --- ¡LA PIEZA CLAVE QUE FALTABA! ---
class CustomJSONResponse(JSONResponse):
    """
    Clase de respuesta JSON personalizada para enseñarle a la aplicación cómo
    serializar tipos de datos complejos que no son nativos de JSON, como ObjectId.
    Este es el método canónico y recomendado por FastAPI para este propósito.
    """
    def render(self, content: any) -> bytes:
        # La función 'default' se pasa al codificador JSON subyacente.
        # Se ejecutará para cualquier tipo de objeto que el codificador no reconozca.
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            default=self.default_encoder,
        ).encode("utf-8")

    @staticmethod
    def default_encoder(obj: any):
        """Define cómo convertir tipos específicos a formatos serializables."""
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        # Levantar un TypeError es importante para que los errores de serialización
        # no pasen desapercibidos si aparece un nuevo tipo de dato no manejado.
        raise TypeError(f"El tipo {type(obj).__name__} no es serializable en JSON")


# Creación de la instancia principal de la aplicación FastAPI.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP PRO.",
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url="/api/redoc" if settings.ENV == "development" else None,
    # Se establece nuestra clase personalizada como la clase de respuesta por defecto
    # para TODA la aplicación. Esto soluciona el 'PydanticSerializationError'.
    default_response_class=CustomJSONResponse
)


# --- SECCIÓN 3: CONFIGURACIÓN DEL MIDDLEWARE DE CORS ---

if settings.ALLOWED_ORIGINS:
    logger.info(f"Configurando CORS para los siguientes orígenes: {settings.ALLOWED_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --- SECCIÓN 4: EVENTOS DEL CICLO DE VIDA DE LA APLICACIÓN (SIN CAMBIOS) ---

@app.on_event("startup")
async def startup_event_handler():
    # ... (código idéntico al tuyo) ...
    logger.info("--- Iniciando Proceso de Arranque de la Aplicación ---")
    try:
        logger.info("Paso 1/4: Conectando a la base de datos MongoDB...")
        await db.connect()
        db_connection = db.get_database()
        logger.info("Paso 1/4: Conexión al cliente de MongoDB establecida.")
        logger.info("Paso 2/4: Verificando la conexión con el servidor de la base de datos (ping)...")
        await db_connection.command("ping")
        logger.info("Paso 2/4: Conexión a la base de datos verificada exitosamente. ✅")
        logger.info("Paso 3/4: Inicializando roles base del sistema...")
        await role_service.initialize_roles(db_connection)
        logger.info("Paso 3/4: Roles inicializados y/o verificados. ✅")
        logger.info("Paso 4/4: Verificando/creando usuario superadministrador...")
        await auth_service.create_secure_superadmin(db_connection)
        logger.info("Paso 4/4: Usuario superadministrador verificado/creado. ✅")
        logger.info("--- Proceso de Arranque Completado Exitosamente. La Aplicación está Lista. ---")
    except Exception as error:
        logger.critical(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: No se pudo iniciar la aplicación.")
        logger.critical(f"Detalle del error: {str(error)}")
        raise

@app.on_event("shutdown")
async def shutdown_event_handler():
    logger.info("--- Cerrando la conexión a la base de datos... ---")
    await db.close()
    logger.info("--- Conexión a la base de datos cerrada exitosamente. ---")


# --- SECCIÓN 5: ORGANIZACIÓN Y REGISTRO DE RUTAS DE LA API (SIN CAMBIOS) ---
api_router = APIRouter()
api_router.include_router(auth_routes.router)
# ... (resto de tus include_router) ...
app.include_router(api_router, prefix="/api")
logger.info("Todos los routers de la API han sido registrados exitosamente bajo el prefijo '/api'. ✅")


# --- SECCIÓN 6: ENDPOINTS GLOBALES (SIN CAMBIOS) ---
@app.get("/", tags=["Sistema"], include_in_schema=False)
async def read_root():
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME}. El servicio está operativo."}

@app.get("/health", tags=["Sistema"])
async def health_check(database: AsyncIOMotorDatabase = Depends(get_db)):
    # ... (código idéntico al tuyo) ...
    try:
        await database.command("ping")
        database_status = "ok"
    except Exception:
        database_status = "error"
        raise HTTPException(status_code=503, detail={"status": "unhealthy", "database_connection": database_status})
    return {"status": "healthy", "environment": settings.ENV, "database_connection": database_status}