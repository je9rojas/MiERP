# /backend/app/core/database.py
# CÓDIGO FLEXIBLE Y DEFINITIVO - LISTO PARA COPIAR Y PEGAR

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
from pymongo.uri_parser import parse_uri
from dotenv import load_dotenv

# Carga las variables de entorno desde el archivo .env en la raíz del backend
load_dotenv()


# --- LECTURA Y LÓGICA DE CONFIGURACIÓN DE BASE DE DATOS ---

MONGO_URI = os.getenv("MONGODB_URI")
# Lee la variable de anulación del nombre de la base de datos.
# Puede ser None si no está definida en .env
DB_NAME_OVERRIDE = os.getenv("MONGODB_DATABASE_NAME")

def get_db_name(uri: str, override: str = None) -> str:
    """
    Determina el nombre de la base de datos a usar con una lógica de prioridad:
    1. Usa el nombre de la variable de anulación (override) si está presente.
    2. Si no, extrae el nombre de la base de datos de la URI de conexión.
    3. Si ninguno está disponible, retorna None.
    """
    if override:
        print(f"ℹ️ Usando nombre de base de datos de MONGODB_DATABASE_NAME: '{override}'")
        return override
    
    if not uri:
        return None
        
    try:
        parsed_uri = parse_uri(uri)
        db_name_from_uri = parsed_uri.get('database')
        if db_name_from_uri:
            print(f"ℹ️ Usando nombre de base de datos extraído de la URI: '{db_name_from_uri}'")
        return db_name_from_uri
    except Exception:
        return None

# Determina el nombre final de la base de datos a usar
DB_NAME = get_db_name(MONGO_URI, DB_NAME_OVERRIDE)


# --- CLASE DE GESTIÓN DE LA BASE DE DATOS ---

class Database:
    _client: AsyncIOMotorClient = None
    _db: AsyncIOMotorDatabase = None

    async def connect(self):
        """
        Establece la conexión con la base de datos MongoDB.
        Se llama una sola vez al iniciar la aplicación.
        """
        print("Iniciando conexión a MongoDB...")
        if not MONGO_URI:
            raise ValueError("La variable de entorno MONGODB_URI no está configurada o el archivo .env no se encontró.")
        
        if not DB_NAME:
            raise ValueError(f"No se pudo determinar el nombre de la base de datos. Asegúrate de que MONGODB_DATABASE_NAME esté en tu .env o que la MONGODB_URI incluya el nombre de la base de datos.")

        # `appName` es útil para el monitoreo en MongoDB Atlas
        self._client = AsyncIOMotorClient(MONGO_URI, appName="MiERP-PRO-Backend")
        
        try:
            await self._client.admin.command('ping')
            self._db = self._client[DB_NAME]
            print(f"✅ Conexión exitosa a MongoDB Atlas. Usando base de datos: '{DB_NAME}'")
        except ConnectionFailure as e:
            print(f"❌ Error de conexión a MongoDB: {e}")
            await self.close()
            raise

    async def close(self):
        """Cierra la conexión a la base de datos. Se llama al apagar la aplicación."""
        if self._client:
            self._client.close()
            print("🔌 Conexión a MongoDB cerrada.")

    def get_database(self) -> AsyncIOMotorDatabase:
        """Retorna la instancia de la base de datos conectada."""
        if self._db is None:
            raise RuntimeError("La base de datos no está conectada. Asegúrate de llamar a 'db.connect()' al iniciar la aplicación.")
        return self._db


# --- INSTANCIA Y DEPENDENCIA DE FASTAPI ---

db = Database()

async def get_db() -> AsyncIOMotorDatabase:
    """Dependencia de FastAPI para obtener la instancia de la base de datos en las rutas."""
    return db.get_database()