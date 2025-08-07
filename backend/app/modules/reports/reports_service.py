# /backend/app/modules/reports/reports_service.py

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
from typing import Optional, Dict, Any
from io import BytesIO

# Modelos específicos para los filtros de este módulo
from .reports_models import CatalogFilterPayload

# Repositorios de otros módulos necesarios para obtener los datos
from app.modules.inventory.repositories.product_repository import ProductRepository

# Servicios Generadores de este módulo
from .services.catalog_service import CatalogPDFGenerator

# ==============================================================================
# SECCIÓN 2: FUNCIONES DEL SERVICIO DE REPORTES
# ==============================================================================

async def generate_product_catalog_pdf(db: AsyncIOMotorDatabase, filters: CatalogFilterPayload) -> Optional[bytes]:
    """
    Orquesta la generación de un catálogo de productos en formato PDF.

    Esta función realiza los siguientes pasos:
    1. Construye una consulta de base de datos basada en los filtros proporcionados.
    2. Utiliza el ProductRepository para obtener los datos de los productos.
    3. Ordena los productos por SKU para una presentación consistente.
    4. Invoca el servicio `CatalogPDFGenerator` para construir el archivo PDF.
    5. Devuelve el contenido del PDF en formato de bytes.

    Args:
        db: La instancia de la base de datos asíncrona.
        filters: Un objeto Pydantic con los filtros a aplicar al catálogo.

    Returns:
        Un objeto `bytes` con el contenido del archivo PDF, o `None` si no se
        encontraron productos que coincidan con los filtros.
    """
    product_repo = ProductRepository(db)
    
    query: Dict[str, Any] = {"is_active": True}
    if filters.search_term:
        search_regex = {"$regex": filters.search_term, "$options": "i"}
        query["$or"] = [{"name": search_regex}, {"sku": search_regex}]
    if filters.product_types:
        query["product_type"] = {"$in": [pt.value for pt in filters.product_types]}

    product_docs = await product_repo.find_all(query)
    
    if not product_docs:
        return None

    # Ordenar los resultados alfabéticamente por SKU
    product_docs.sort(key=lambda p: p.get('sku', ''))

    # Utilizar un buffer en memoria para generar el PDF
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