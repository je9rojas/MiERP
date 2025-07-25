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
import logging
from datetime import datetime

# Importaciones de librerías de terceros
from fastapi import FastAPI, APIRouter, Depends, HTTPException
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


# --- SECCIÓN 2: CONFIGURACIÓN DE LOGGING, SERIALIZADOR Y APLICACIÓN ---

# Configuración del sistema de logging para obtener un output claro y estructurado.
logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logger = logging.getLogger(__name__)

# --- SOLUCIÓN FINAL: Función de serialización personalizada para la API ---
def json_serializer(obj):
    """
    Función de ayuda para enseñarle a FastAPI cómo convertir tipos de datos complejos
    (que no son nativos de JSON) a un formato serializable al crear una respuesta.
    """
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        # Asegura que los objetos datetime se conviertan a un string estándar ISO 8601.
        return obj.isoformat()
    # Si se encuentra un tipo que no se sabe cómo serializar, se levanta un error.
    # Esto mantiene el comportamiento por defecto para otros tipos.
    raise TypeError(f"El tipo {type(obj).__name__} no es serializable en JSON")

# Creación de la instancia principal de la aplicación FastAPI con metadatos del proyecto.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API Backend para el sistema de gestión empresarial MiERP PRO.",
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url="/api/redoc" if settings.ENV == "development" else None,
    # Se inyecta el serializador personalizado en la configuración JSON de la aplicación.
    # Esto soluciona el 'PydanticSerializationError' para ObjectId a nivel de API.
    json_serializer=json_serializer
)


# --- SECCIÓN 3: CONFIGURACIÓN DEL MIDDLEWARE DE CORS ---

# El middleware de CORS es fundamental para permitir que el frontend (ej. React en localhost:3000)
# pueda realizar peticiones a este backend (ej. en localhost:8000).
if settings.ALLOWED_ORIGINS:
    logger.info(f"Configurando CORS para los siguientes orígenes: {settings.ALLOWED_ORIGINS}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, PUT, DELETE, etc.)
        allow_headers=["*"],  # Permite todas las cabeceras en las peticiones.
    )


# --- SECCIÓN 4: EVENTOS DEL CICLO DE VIDA DE LA APLICACIÓN ---

@app.on_event("startup")
async def startup_event_handler():
    """
    Se ejecuta una sola vez al iniciar la aplicación. Conecta a la base de datos
    y ejecuta tareas de inicialización críticas con logging detallado.
    """
    logger.info("--- Iniciando Proceso de Arranque de la Aplicación ---")
    try:
        # Paso 1: Conexión con la Base de Datos
        logger.info("Paso 1/4: Conectando a la base de datos MongoDB...")
        await db.connect()
        db_connection = db.get_database()
        logger.info("Paso 1/4: Conexión al cliente de MongoDB establecida.")

        # Paso 2: Verificación de la Conexión
        logger.info("Paso 2/4: Verificando la conexión con el servidor de la base de datos (ping)...")
        await db_connection.command("ping")
        logger.info("Paso 2/4: Conexión a la base de datos verificada exitosamente. ✅")

        # Paso 3: Inicialización de Roles del Sistema
        logger.info("Paso 3/4: Inicializando roles base del sistema...")
        await role_service.initialize_roles(db_connection)
        logger.info("Paso 3/4: Roles inicializados y/o verificados. ✅")

        # Paso 4: Creación del Superadministrador
        logger.info("Paso 4/4: Verificando/creando usuario superadministrador...")
        await auth_service.create_secure_superadmin(db_connection)
        logger.info("Paso 4/4: Usuario superadministrador verificado/creado. ✅")

        logger.info("--- Proceso de Arranque Completado Exitosamente. La Aplicación está Lista. ---")

    except Exception as error:
        logger.critical(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: No se pudo iniciar la aplicación.")
        logger.critical(f"Detalle del error: {str(error)}")
        # Levantar la excepción interrumpe el inicio si algo falla, lo cual es el comportamiento deseado.
        raise

@app.on_event("shutdown")
async def shutdown_event_handler():
    """
    Se ejecuta al detener la aplicación para cerrar recursos de forma segura.
    """
    logger.info("--- Cerrando la conexión a la base de datos... ---")
    await db.close()
    logger.info("--- Conexión a la base de datos cerrada exitosamente. ---")


# --- SECCIÓN 5: ORGANIZACIÓN Y REGISTRO DE RUTAS DE LA API ---

# Se crea un router principal para la API. Este es el patrón recomendado para agrupar
# todas las rutas de negocio bajo un único prefijo (ej. /api), manteniendo el código limpio.
api_router = APIRouter()

# Se incluyen los routers de cada módulo de negocio DENTRO del router principal de la API.
api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(role_routes.router)
api_router.include_router(product_routes.router)
api_router.include_router(supplier_routes.router)
api_router.include_router(customer_routes.router)
api_router.include_router(purchasing_routes.router)
api_router.include_router(data_management_routes.router)

# Finalmente, se incluye el router principal de la API en la aplicación,
# asignando el prefijo global "/api" UNA SOLA VEZ.
app.include_router(api_router, prefix="/api")
logger.info("Todos los routers de la API han sido registrados exitosamente bajo el prefijo '/api'. ✅")


# --- SECCIÓN 6: ENDPOINTS GLOBALES (RAÍZ Y VERIFICACIÓN DE SALUD) ---

# Estos endpoints están fuera del prefijo /api y sirven para comprobaciones básicas.
@app.get("/", tags=["Sistema"], include_in_schema=False)
async def read_root():
    """
    Endpoint raíz para una verificación rápida de que el servicio está en línea.
    """
    return {"message": f"Bienvenido a la API de {settings.PROJECT_NAME}. El servicio está operativo."}

@app.get("/health", tags=["Sistema"])
async def health_check(database: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Endpoint de "salud" que verifica el estado del servicio y sus dependencias críticas,
    como la conexión a la base de datos. Esencial para sistemas de monitoreo.
    """
    try:
        await database.command("ping")
        database_status = "ok"
    except Exception:
        database_status = "error"
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "database_connection": database_status}
        )

    return {
        "status": "healthy",
        "environment": settings.ENV,
        "database_connection": database_status
    }