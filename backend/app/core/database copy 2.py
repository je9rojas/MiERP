# /backend/app/core/database.py
# CÓDIGO CORREGIDO Y REFACTORIZADO

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DATABASE_NAME", "MiERP-PRO") # Usa un nombre por defecto si no está en .env

class Database:
    _client: AsyncIOMotorClient = None
    _db: AsyncIOMotorDatabase = None

    async def connect(self):
        print("Iniciando conexión a MongoDB...")
        if not MONGO_URI:
            raise ValueError("La variable de entorno MONGODB_URI no está configurada.")
        
        self._client = AsyncIOMotorClient(MONGO_URI)
        try:
            # Verificar conexión
            await self._client.admin.command('ping')
            self._db = self._client[DB_NAME]
            print(f"✅ Conexión exitosa a MongoDB. Usando base de datos: '{DB_NAME}'")
        except ConnectionFailure as e:
            print(f"❌ Error de conexión a MongoDB: {e}")
            await self.close()
            raise

    async def close(self):
        if self._client:
            self._client.close()
            print("🔌 Conexión a MongoDB cerrada.")

    def get_database(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("La base de datos no está conectada. Llama a 'connect()' primero.")
        return self._db

# Instancia global que será usada por la aplicación
db = Database()

# Función de dependencia para FastAPI, para inyectar la DB en las rutas
async def get_db() -> AsyncIOMotorDatabase:
    return db.get_database()