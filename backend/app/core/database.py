# /backend/app/core/database.py

"""
Módulo de Gestión de la Base de Datos.

Este archivo es el único responsable de manejar el ciclo de vida de la conexión
a la base de datos MongoDB. Expone una instancia global 'db' para ser usada
en el arranque de la aplicación y dependencias para inyectar las diferentes
conexiones de base de datos (producción, archivo) en las rutas de la API.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure

from app.core.config import settings

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: CLASE DE GESTIÓN DE LA CONEXIÓN
# ==============================================================================

class DatabaseManager:
    """
    Gestiona el cliente y las conexiones a las bases de datos MongoDB.
    Sigue el patrón Singleton al ser instanciada una sola vez globalmente.
    """
    _client: AsyncIOMotorClient = None
    _prod_db: AsyncIOMotorDatabase = None
    _archive_db: AsyncIOMotorDatabase = None

    async def connect_to_database(self):
        """
        Establece la conexión con el clúster de MongoDB y obtiene los punteros
        a las bases de datos de producción y archivo.
        Se llama una sola vez al iniciar la aplicación.
        """
        logger.info("Iniciando conexión con la base de datos MongoDB...")
        
        self._client = AsyncIOMotorClient(
            settings.DATABASE_URL,
            appName="MiERP-PRO-Backend",
            serverSelectionTimeoutMS=5000
        )
        
        try:
            # Obtiene los punteros a las bases de datos usando los nombres de la configuración.
            # Esta es una operación ligera; no establece conexiones adicionales.
            self._prod_db = self._client[settings.MONGO_PROD_DB_NAME]
            self._archive_db = self._client[settings.MONGO_ARCHIVE_DB_NAME]

            if self._prod_db is None or self._archive_db is None:
                raise ValueError("No se pudieron obtener los punteros de las bases de datos.")
            
            # Verifica la conexión real con el servidor.
            await self._client.admin.command('ping')
            logger.info(f"Conexión exitosa a MongoDB. BD de producción: '{self._prod_db.name}', BD de archivo: '{self._archive_db.name}'")
        
        except (ConnectionFailure, ValueError) as error:
            logger.critical(f"Error crítico durante la conexión a la base de datos: {error}")
            await self.close_database_connection()
            raise

    async def close_database_connection(self):
        """
        Cierra la conexión a la base de datos. Se llama al apagar la aplicación.
        """
        if self._client:
            self._client.close()
            logger.info("Conexión a la base de datos MongoDB cerrada.")

    def get_prod_database(self) -> AsyncIOMotorDatabase:
        """Retorna la instancia de la base de datos de PRODUCCIÓN conectada."""
        if self._prod_db is None:
            raise RuntimeError("La base de datos de producción no está conectada.")
        return self._prod_db

    def get_archive_database(self) -> AsyncIOMotorDatabase:
        """Retorna la instancia de la base de datos de ARCHIVO conectada."""
        if self._archive_db is None:
            raise RuntimeError("La base de datos de archivo no está conectada.")
        return self._archive_db

# ==============================================================================
# SECCIÓN 3: INSTANCIA GLOBAL Y DEPENDENCIAS DE FASTAPI
# ==============================================================================

# Instancia global para ser usada en el ciclo de vida de la aplicación (startup/shutdown)
db_manager = DatabaseManager()

# --- Dependencias de FastAPI ---

async def get_db() -> AsyncIOMotorDatabase:
    """
    Dependencia de FastAPI para inyectar la base de datos de PRODUCCIÓN.
    
    Este es el generador por defecto. No se necesita cambiar ningún endpoint existente.
    """
    return db_manager.get_prod_database()

async def get_archive_db() -> AsyncIOMotorDatabase:
    """
    Dependencia de FastAPI para inyectar la base de datos de ARCHIVO.

    Úsese en endpoints que necesiten consultar datos históricos.
    """
    return db_manager.get_archive_database()