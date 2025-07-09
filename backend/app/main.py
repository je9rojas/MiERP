# /backend/app/main.py
# CÓDIGO FINAL Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

import asyncio
from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- Importaciones de la aplicación ---

# Importar la instancia de base de datos y la dependencia
from app.core.database import db, get_db

# Importar la configuración de la aplicación
from app.core.config import settings

# Importar los módulos de rutas
from app.routes import (
    auth, 
    products, 
    users, 
    roles, 
    suppliers,
    purchase_orders
)

# Importar los servicios necesarios para la inicialización
from app.services import auth_service, role_service

# --- Inicialización de la Aplicación FastAPI ---

app = FastAPI(
    title="MiERP PRO API",
    version="1.0.0",
    description="La API backend para el sistema de gestión empresarial MiERP PRO.",
    # Oculta la documentación de la API en entornos de producción por seguridad
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# --- Configuración de Middleware (CORS) ---

# Permite que el frontend se comunique con esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Lógica de Inicialización de la Aplicación (Eventos Startup) ---

async def initialize_application(db_conn: AsyncIOMotorDatabase):
    """
    Función central para realizar tareas de inicialización después de conectar a la DB.
    - Inicializa los roles base.
    - Crea un superadmin si no existe ninguno.
    """
    print("--- Iniciando tareas de arranque de la aplicación ---")
    
    # 1. Inicializar roles usando el servicio de roles
    await role_service.initialize_roles(db_conn)
    
    # 2. Verificar y crear superadmin seguro si es necesario
    existing_superadmin = await db_conn.users.find_one({"role": "superadmin"})
    if not existing_superadmin:
        print("🔧 No se encontró un superadmin. Creando uno nuevo...")
        superadmin_id = await auth_service.create_secure_superadmin(db_conn)
        if superadmin_id:
            print(f"✅ Superadmin seguro creado con ID: {superadmin_id}")
        else:
            print("⚠️ ADVERTENCIA: No se pudo crear el superadmin seguro.")
    else:
        print("✅ Superadmin ya existe en la base de datos.")
    
    print("--- Tareas de arranque completadas ---")


@app.on_event("startup")
async def startup_event():
    """
    Se ejecuta una sola vez cuando el servidor de FastAPI se inicia.
    """
    try:
        # Conectar a la base de datos usando la instancia de la clase Database
        await db.connect()
        # Una vez conectado, ejecutar las tareas de inicialización
        await initialize_application(db.get_database())
    except Exception as e:
        print(f"❌ ERROR CRÍTICO DURANTE EL ARRANQUE: {str(e)}")
        # En un caso real, podrías querer que la app no inicie si la DB falla.
        # Por ahora, solo lo imprimimos para depuración.
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """
    Se ejecuta una sola vez cuando el servidor de FastAPI se apaga.
    """
    # Cierra la conexión a la base de datos de forma segura
    await db.close()
    print("🔌 Conexión a MongoDB cerrada.")


# --- Arquitectura de Rutas (API Router) ---

# Se crea un router principal para agrupar todas las rutas bajo el prefijo "/api".
api_router = APIRouter(prefix="/api")

# Se incluyen los routers de cada módulo DENTRO de este router principal.
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(products.router)
api_router.include_router(suppliers.router)
api_router.include_router(purchase_orders.router)

# Finalmente, se incluye el router principal en la aplicación.
app.include_router(api_router)


# --- Rutas Raíz y de Verificación de Salud ---

@app.get("/")
async def read_root():
    """Endpoint raíz para una verificación rápida."""
    return {"message": "MiERP PRO API está en funcionamiento."}

@app.get("/health", tags=["System"])
async def health_check(db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Endpoint de verificación de salud que comprueba la conectividad de la base de datos.
    """
    try:
        # "ping" es un comando ligero para verificar la conexión a MongoDB
        await db_conn.command("ping")
        return {
            "status": "healthy",
            "environment": settings.ENV,
            "database_connection": "ok",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"El servicio no está disponible. Error de base de datos: {str(e)}"
        )