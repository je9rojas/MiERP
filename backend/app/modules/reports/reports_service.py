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

    Implementa una lógica de filtrado jerárquica para soportar múltiples
    modos de generación:
    1. Por SKUs específicos (máxima prioridad).
    2. Por Marcas y/o Tipos de Producto.
    3. Completo (si no se aplican otros filtros).
    """
    product_repo = ProductRepository(db)
    product_docs: List[Dict[str, Any]] = []

    # --- Lógica de Selección de Datos con Prioridad ---

    if filters.product_skus:
        # Prioridad 1: Catálogo Personalizado por lista de SKUs.
        found_docs = await product_repo.find_by_skus(filters.product_skus)
        sku_map = {doc['sku']: doc for doc in found_docs}
        # Se preserva el orden original de la lista de SKUs del usuario.
        product_docs = [sku_map[sku] for sku in filters.product_skus if sku in sku_map]

    else:
        # Prioridad 2: Catálogo General o filtrado por Marca y/o Tipo.
        query: Dict[str, Any] = {"is_active": True}
        
        if filters.brands:
            query["brand"] = {"$in": filters.brands}

        if filters.product_types:
            query["product_type"] = {"$in": [pt.value for pt in filters.product_types]}
        
        product_docs = await product_repo.find_all(query)
        # Para catálogos no personalizados, se ordena alfabéticamente por SKU.
        product_docs.sort(key=lambda p: p.get('sku', ''))

    if not product_docs:
        return None

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