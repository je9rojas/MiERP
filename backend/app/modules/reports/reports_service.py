# backend/app/modules/reports/reports_service.py

"""
Capa de Servicio para el módulo de Reportes.

Este módulo centraliza la lógica de negocio para la generación de todos los
reportes del sistema. Orquesta la obtención de datos desde diferentes
repositorios, aplica la lógica de filtrado y formato necesaria, y utiliza
servicios generadores específicos (como `CatalogPDFGenerator`) para producir
los archivos finales (ej. PDF, Excel).
"""

# =-============================================================================
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

    Esta función es flexible y maneja dos casos de uso principales:
    1.  **Catálogo Personalizado:** Si se proporciona una lista de SKUs, se genera
        un catálogo exclusivamente con esos productos, ignorando otros filtros.
    2.  **Catálogo Completo:** Si no se proporcionan SKUs, se genera un catálogo
        con todos los productos, aplicando opcionalmente los filtros de búsqueda.
    """
    product_repo = ProductRepository(db)
    product_docs: List[Dict[str, Any]]

    # --- Lógica de Selección de Datos ---
    if filters.product_skus:
        # --- CASO 1: Catálogo Personalizado por lista de SKUs ---
        # Se buscan los productos que coinciden con la lista de SKUs proporcionada.
        found_docs = await product_repo.find_by_skus(filters.product_skus)
        
        # Se preserva el orden original de la lista de SKUs, ya que es el orden
        # en que el usuario los seleccionó en la interfaz.
        sku_map = {doc['sku']: doc for doc in found_docs}
        product_docs = [sku_map[sku] for sku in filters.product_skus if sku in sku_map]

    else:
        # --- CASO 2: Catálogo Completo (con filtros opcionales) ---
        query: Dict[str, Any] = {"is_active": True}
        if filters.search_term:
            search_regex = {"$regex": filters.search_term, "$options": "i"}
            query["$or"] = [{"name": search_regex}, {"sku": search_regex}]
        if filters.product_types:
            query["product_type"] = {"$in": [pt.value for pt in filters.product_types]}
        
        product_docs = await product_repo.find_all(query)
        # Para el catálogo completo, se ordena alfabéticamente por SKU.
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