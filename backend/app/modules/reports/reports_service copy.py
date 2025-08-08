# backend/app/modules/reports/reports_service.py

"""
Capa de Servicio para el módulo de Reportes.

Este módulo centraliza la lógica de negocio para la generación de todos los
reportes del sistema. Orquesta la obtención de datos desde diferentes
repositorios, aplica la lógica de filtrado y formato necesaria, y utiliza
servicios generadores específicos (como `CatalogPDFGenerator`) para producir
los archivos finales (ej. PDF, Excel).
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any, List
from io import BytesIO

from .reports_models import CatalogFilterPayload
from app.modules.inventory.repositories.product_repository import ProductRepository
from .services.catalog_service import CatalogPDFGenerator

# ==============================================================================
# SECCIÓN 2: FUNCIONES DEL SERVICIO DE REPORTES
# ==============================================================================

async def generate_product_catalog_pdf(db: AsyncIOMotorDatabase, filters: CatalogFilterPayload) -> Optional[bytes]:
    """
    Orquesta la generación de un catálogo de productos en formato PDF.

    Construye una consulta de base de datos a partir de los filtros opcionales
    de marca y tipo de producto. Si no se proporcionan filtros, genera el
    catálogo completo.
    """
    product_repo = ProductRepository(db)
    
    # --- Construcción de la Consulta a la Base de Datos ---
    query: Dict[str, Any] = {"is_active": True}
    
    # Añadir filtro por marcas si se proporciona
    if filters.brands:
        query["brand"] = {"$in": filters.brands}

    # Añadir filtro por tipos de producto si se proporciona
    if filters.product_types:
        query["product_type"] = {"$in": [pt.value for pt in filters.product_types]}
    
    # Obtener los datos desde el repositorio
    product_docs = await product_repo.find_all(query)
    
    if not product_docs:
        return None

    # Ordenar los resultados alfabéticamente por SKU para una presentación consistente
    product_docs.sort(key=lambda p: p.get('sku', ''))

    # --- Generación del Documento PDF ---
    buffer = BytesIO()
    generator = CatalogPDFGenerator(
        products=product_docs,
        buffer=buffer,
        view_type=filters.view_type
    )
    generator.build()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes