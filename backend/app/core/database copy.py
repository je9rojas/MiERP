# /backend/app/core/database.py

"""
Módulo de Gestión de la Base de Datos.

Este archivo es el único responsable de manejar el ciclo de vida de la conexión
a la base de datos MongoDB. Expone una instancia global 'db' para ser usada
en el arranque de la aplicación y una dependencia 'get_db' para inyectar
la sesión de la base de datos en las rutas de la API.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import logging

# Importa el objeto de configuración centralizado, que es la única fuente de verdad.
from app.core.config import settings

# Obtiene una instancia del logger configurado en main.py
logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: CLASE DE GESTIÓN DE LA CONEXIÓN
# ==============================================================================

class DatabaseManager:
    """
    Gestiona el cliente y la conexión a la base de datos MongoDB.
    Sigue el patrón Singleton al ser instanciada una sola vez globalmente.
    """
    _client: AsyncIOMotorClient = None
    _database: AsyncIOMotorDatabase = None

    async def connect_to_database(self):
        """
        Establece la conexión con MongoDB. Se llama una sola vez al iniciar la aplicación.
        Utiliza la DATABASE_URL del objeto de configuración 'settings'.
        """
        logger.info("Iniciando conexión con la base de datos MongoDB...")
        
        self._client = AsyncIOMotorClient(
            settings.DATABASE_URL,
            appName="MiERP-PRO-Backend",
            serverSelectionTimeoutMS=5000
        )
        
        try:
            self._database = self._client.get_default_database()
            
            # --- INICIO DE LA CORRECCIÓN ---
            # Comparamos explícitamente con 'is None' como pide PyMongo.
            if self._database is None:
            # --- FIN DE LA CORRECCIÓN ---
                raise ValueError(
                    "No se pudo determinar el nombre de la base de datos desde la URI. "
                    "Asegúrate de que la DATABASE_URL incluye el nombre de la base de datos "
                    "(ej: ...mongodb.net/mi_base_de_datos?...)."
                )
            
            await self._client.admin.command('ping')
            logger.info(f"Conexión exitosa a MongoDB. Base de datos en uso: '{self._database.name}'")
        
        except ConnectionFailure as e:
            logger.critical(f"Error de conexión a MongoDB: {e}")
            await self.close_database_connection()
            raise
        except ValueError as e:
            logger.critical(f"Error de configuración de la base de datos: {e}")
            await self.close_database_connection()
            raise

    async def close_database_connection(self):
        """
        Cierra la conexión a la base de datos. Se llama al apagar la aplicación.
        """
        if self._client:
            self._client.close()
            logger.info("Conexión a la base de datos MongoDB cerrada.")

    def get_database_session(self) -> AsyncIOMotorDatabase:
        """
        Retorna la instancia de la base de datos conectada.
        """
        if self._database is None:
            raise RuntimeError(
                "La base de datos no está conectada. "
                "Asegúrate de que el evento de startup se ha completado."
            )
        return self._database

# ==============================================================================
# SECCIÓN 3: INSTANCIA GLOBAL Y DEPENDENCIA DE FASTAPI
# ==============================================================================

db_manager = DatabaseManager()

db_manager.connect = db_manager.connect_to_database
db_manager.close = db_manager.close_database_connection
db_manager.get_database = db_manager.get_database_session

db = db_manager

async def get_db() -> AsyncIOMotorDatabase:
    """
    Dependencia de FastAPI para inyectar la sesión de la base de datos en las rutas.
    """
    return db.get_database()