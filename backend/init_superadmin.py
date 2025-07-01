import asyncio
import os
from app.core.database import db_client
from app.services.auth_service import create_superadmin

# Configuración directa (sin email)
os.environ["MONGODB_URI"] = "mongodb+srv://db_admin:dQ6n5znkCVO0ANm6@erp-cluster.fzyhb.mongodb.net/midb?retryWrites=true&w=majority&appName=ERP-cluster"
os.environ["SUPERADMIN_INITIAL_PASSWORD"] = "Admin123!"

async def main():
    try:
        await db_client.connect()
        superadmin_id = await create_superadmin()
        if superadmin_id:
            print(f"✅ Superadmin creado. ID: {superadmin_id}")
            print("Usuario: superadmin")
            print(f"Contraseña: {os.getenv('SUPERADMIN_INITIAL_PASSWORD')}")
        else:
            print("ℹ️ Ya existe un usuario superadmin en la base de datos")
    except Exception as e:
        print(f"❌ Error al crear superadmin: {e}")
    finally:
        await db_client.close()

if __name__ == "__main__":
    asyncio.run(main())