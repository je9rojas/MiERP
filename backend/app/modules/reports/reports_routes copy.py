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

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserOut # Usamos UserOut para el tipado
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
        200: {
            "description": "Catálogo PDF generado exitosamente.",
            "content": {"application/pdf": {}}
        },
        404: {"description": "No se encontraron productos para los filtros seleccionados."}
    }
)
async def generate_product_catalog_route(
    filters: CatalogFilterPayload,
    db=Depends(get_db),
    _user: UserOut = Depends(role_checker(is_active=True)) # Cualquier usuario activo puede generar reportes
):
    """
    Endpoint para generar un catálogo de productos en PDF.

    Delega la lógica de negocio a la capa de servicio de reportes y maneja
    la respuesta del archivo PDF al cliente.
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