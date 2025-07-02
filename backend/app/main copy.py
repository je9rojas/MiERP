import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, products
from app.services.auth_service import create_secure_superadmin, force_credentials_rotation
from app.core.database import db_client
from app.core.config import settings

app = FastAPI(
    title="MiERP API",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENV == "development" else None,
    redoc_url=None
)

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluye los routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])

# Tarea de rotación de credenciales
rotation_task = None

async def rotate_credentials_job():
    """Tarea periódica para rotar credenciales privilegiadas"""
    while True:
        try:
            await asyncio.sleep(settings.CREDENTIAL_ROTATION_DAYS * 24 * 3600)
            print("🔐 Iniciando rotación automática de credenciales...")
            await force_credentials_rotation()
            print("✅ Rotación de credenciales completada")
        except asyncio.CancelledError:
            print("🔇 Tarea de rotación cancelada")
            break
        except Exception as e:
            print(f"❌ Error en rotación de credenciales: {str(e)}")
            # Reintentar después de 1 hora en caso de error
            await asyncio.sleep(3600)

@app.on_event("startup")
async def startup_event():
    global rotation_task
    try:
        # Conectar a la base de datos
        await db_client.connect()
        print("✅ Conectado a MongoDB Atlas")
        
        # Crear superadmin seguro si no existe
        if not await db_client.db.users.find_one({"role": "superadmin"}):
            superadmin_id = await create_secure_superadmin()
            if superadmin_id:
                print(f"✅ Superadmin seguro creado con ID: {superadmin_id}")
            else:
                print("⚠️ No se pudo crear el superadmin")
        else:
            print("✅ Superadmin ya existe en la base de datos")
        
        # Iniciar tarea de rotación periódica
        if settings.ENABLE_CREDENTIAL_ROTATION:
            rotation_task = asyncio.create_task(rotate_credentials_job())
            print("🔄 Tarea de rotación de credenciales iniciada")
    except Exception as e:
        print(f"❌ Error durante la inicialización: {str(e)}")
        # En producción, deberíamos notificar a un sistema de monitoreo
        raise

@app.on_event("shutdown")
async def shutdown_event():
    global rotation_task
    # Cancelar tarea de rotación si está activa
    if rotation_task and not rotation_task.done():
        rotation_task.cancel()
        try:
            await rotation_task
        except asyncio.CancelledError:
            pass
    
    # Cerrar conexión a la base de datos
    await db_client.close()
    print("❌ Desconectado de MongoDB Atlas")

@app.get("/")
def read_root():
    return {"message": "MiERP API - Sistema de Gestión Empresarial"}

@app.get("/api/health")
async def health_check():
    """Endpoint de verificación de salud del sistema"""
    try:
        # Verificar conexión a la base de datos
        await db_client.db.command("ping")
        
        return {
            "status": "healthy",
            "environment": settings.ENV,
            "database": "connected",
            "credential_rotation": "active" if rotation_task and not rotation_task.done() else "inactive"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Service unavailable: {str(e)}"
        )