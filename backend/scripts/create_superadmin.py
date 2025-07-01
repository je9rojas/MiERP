#!/usr/bin/env python3
"""
Script para creación manual de superadmin
Uso solo en casos especiales o recuperación de emergencia
"""

import asyncio
import os
import sys
from dotenv import load_dotenv
from app.core.database import db_client
from app.services.auth_service import create_secure_superadmin

# Configurar path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

async def main():
    try:
        print("🚀 Iniciando creación de superadmin...")
        await db_client.connect()
        superadmin_id = await create_secure_superadmin()
        
        if superadmin_id:
            print(f"✅ Superadmin creado exitosamente! ID: {superadmin_id}")
            print("🔐 Credenciales almacenadas en: ./secure/initial_credentials.json")
        else:
            print("ℹ️ Superadmin ya existe en la base de datos")
    except Exception as e:
        print(f"❌ Error crítico: {str(e)}")
    finally:
        await db_client.close()
        print("🔚 Conexión cerrada")

if __name__ == "__main__":
    asyncio.run(main())

#python -m scripts.create_superadmin