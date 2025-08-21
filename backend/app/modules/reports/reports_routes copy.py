# /backend/app/modules/reports/reports_routes.py

"""
Define los endpoints de la API para el módulo de Reportes.

Este router expone las operaciones para la generación de diferentes tipos de
reportes del sistema, como catálogos de productos, reportes de ventas, etc.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
# Se importa la dependencia que verifica si el usuario está activo
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.user_models import UserOut
from . import reports_service
from .reports_models import CatalogFilterPayload

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL ROUTER
# ==============================================================================

router = APIRouter(
    prefix="/reports",
    tags=["Reportes"]
)

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

@router.post(
    "/catalog",
    summary="Generar Catálogo de Productos en PDF",
    description="Genera un catálogo de productos en formato PDF basado en los filtros proporcionados. La respuesta es un archivo binario.",
    response_class=Response,
    responses={
        200: {"description": "Catálogo PDF generado exitosamente.", "content": {"application/pdf": {}}},
        404: {"description": "No se encontraron productos para los filtros seleccionados."}
    }
)
async def generate_product_catalog_route(
    filters: CatalogFilterPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # --- CORRECCIÓN CLAVE ---
    # Se utiliza la dependencia estándar que ya verifica que el usuario
    # esté autenticado y activo. Es más limpio y reutiliza la lógica existente.
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Endpoint para generar un catálogo de productos en PDF.
    
    Cualquier usuario autenticado y activo puede generar reportes. La lógica
    de negocio se delega a la capa de servicio de reportes.
    """
    pdf_bytes = await reports_service.generate_product_catalog_pdf(db, filters)
    
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron productos que coincidan con los filtros para generar el catálogo."
        )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=catalogo_productos.pdf"}
    )