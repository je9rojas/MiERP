import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
            self.db = self.client.get_database()
            # Verificar conexión
            await self.db.command('ping')
            print("✅ Conectado a MongoDB Atlas")
        except ConnectionFailure as e:
            print("❌ Error de conexión a MongoDB:", e)
            raise

    async def close(self):
        if self.client:
            self.client.close()

db_client = MongoDB()