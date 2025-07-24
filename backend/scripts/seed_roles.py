# /backend/scripts/seed_roles.py
# SCRIPT PARA CREAR O ACTUALIZAR ROLES Y SUS PERMISOS EN MONGODB

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.constants import permissions # Importamos las constantes para evitar errores

# --- CONFIGURACIÓN DE LA BASE DE DATOS ---
# ¡IMPORTANTE! Reemplaza esto con tu string de conexión real.
# Es mejor leerlo de una variable de entorno en un caso real.
MONGO_CONNECTION_STRING = "mongodb+srv://<user>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority"
DATABASE_NAME = "tu_erp_db" # El nombre de tu base de datos

# --- DEFINICIÓN DE ROLES Y PERMISOS ---
# Esta es la fuente única de verdad para la configuración de roles.
ROLES_DEFINITION = [
    {
        "name": "superadmin",
        "description": "Acceso total al sistema. Este rol tiene permisos implícitos en el código y no necesita una lista aquí.",
        "permissions": [] # Los permisos del superadmin se manejan en el código, no en la BD.
    },
    {
        "name": "admin",
        "description": "Administrador del sistema con amplios poderes de gestión.",
        "permissions": [
            permissions.PURCHASE_ORDER_CREATE,
            permissions.PURCHASE_ORDER_VIEW,
            permissions.PURCHASE_ORDER_EDIT,
            permissions.PURCHASE_ORDER_APPROVE,
            permissions.USER_MANAGE,
            permissions.ROLE_MANAGE,
        ]
    },
    {
        "name": "manager",
        "description": "Gerente de área, puede aprobar compras y gestionar usuarios de su equipo.",
        "permissions": [
            permissions.PURCHASE_ORDER_CREATE,
            permissions.PURCHASE_ORDER_VIEW,
            permissions.PURCHASE_ORDER_APPROVE,
        ]
    },
    {
        "name": "warehouse",
        "description": "Personal de almacén, puede crear y ver órdenes de compra.",
        "permissions": [
            permissions.PURCHASE_ORDER_CREATE,
            permissions.PURCHASE_ORDER_VIEW,
        ]
    },
    {
        "name": "sales",
        "description": "Personal de ventas, solo puede ver información relevante para su trabajo.",
        "permissions": [
            # Por ejemplo: 'product:view', 'customer:view'
        ]
    },
]

async def seed_roles():
    """
    Conecta a la base de datos y crea/actualiza los roles definidos en ROLES_DEFINITION.
    """
    print("Iniciando script para poblar roles...")
    client = AsyncIOMotorClient(MONGO_CONNECTION_STRING)
    db = client[DATABASE_NAME]
    roles_collection = db.roles
    
    print(f"Conectado a la base de datos '{DATABASE_NAME}'.")
    
    for role_data in ROLES_DEFINITION:
        role_name = role_data["name"]
        print(f"Procesando rol: '{role_name}'...")
        
        # Usamos update_one con upsert=True.
        # Si un rol con ese nombre ya existe, lo actualiza.
        # Si no existe, lo inserta.
        await roles_collection.update_one(
            {"name": role_name},
            {"$set": role_data},
            upsert=True
        )
        print(f"✅ Rol '{role_name}' guardado exitosamente.")
        
    print("\n¡Script de población de roles completado!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_roles())