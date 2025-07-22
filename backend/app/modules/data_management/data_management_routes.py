# /backend/app/modules/data_management/data_management_routes.py
# GESTOR DE RUTAS PARA LA IMPORTACIÓN Y EXPORTACIÓN DE DATOS MAESTROS

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- SECCIÓN DE IMPORTACIONES DEL NÚCLEO Y MÓDULOS ---
# Se importan las dependencias necesarias para la base de datos, la seguridad y los servicios.

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole
from . import data_management_service

# --- SECCIÓN DE CONFIGURACIÓN DEL ROUTER ---
# Se define el router con un prefijo y una etiqueta para la organización
# en la aplicación principal y en la documentación.
router = APIRouter(prefix="/data", tags=["Gestión de Datos"])

# Se definen los roles que tendrán acceso a estas funcionalidades críticas.
ROLES_ALLOWED_FOR_DATA_MANAGEMENT = [UserRole.SUPERADMIN, UserRole.ADMIN]

# --- SECCIÓN DE ENDPOINTS ---

@router.get(
    "/export/products",
    summary="Exportar todos los productos a CSV",
    response_description="Un archivo CSV con todos los productos.",
)
async def export_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(role_checker(ROLES_ALLOWED_FOR_DATA_MANAGEMENT))
):
    """
    Genera y devuelve un archivo CSV que contiene todos los productos del sistema.
    Esta operación requiere permisos de administrador.
    """
    csv_data = await data_management_service.export_products_to_csv(db)
    
    response = StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=productos_backup_{_get_timestamp()}.csv"}
    )
    return response

@router.post(
    "/import/products",
    summary="Importar productos desde un archivo CSV",
    response_description="Un resumen de la operación de importación.",
)
async def import_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    file: UploadFile = File(..., description="Archivo CSV para importar, debe seguir la plantilla de exportación."),
    current_user: dict = Depends(role_checker(ROLES_ALLOWED_FOR_DATA_MANAGEMENT))
):
    """

    Procesa un archivo CSV subido para crear, actualizar o desactivar productos en masa.
    Esta operación requiere permisos de administrador.
    """
    if not file.filename.endswith('.csv'):
        return {"error": "El archivo debe ser de tipo CSV."}
    
    result = await data_management_service.import_products_from_csv(db, file)
    return result

# --- SECCIÓN DE FUNCIONES AUXILIARES ---

def _get_timestamp() -> str:
    """Función auxiliar para generar un timestamp para los nombres de archivo."""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")