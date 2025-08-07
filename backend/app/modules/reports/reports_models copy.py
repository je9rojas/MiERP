# backend/app/modules/reports/reports_models.py

"""
Define los modelos de datos de Pydantic para el módulo de Reportes.

Este archivo contiene los modelos que definen las estructuras de datos de entrada
(payloads de filtros) y de salida (si fueran necesarios) para la generación
de los diferentes reportes del sistema.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field
from typing import List, Optional

from app.modules.inventory.product_models import FilterType

# ==============================================================================
# SECCIÓN 2: MODELOS DE PAYLOAD PARA REPORTES
# ==============================================================================

class CatalogFilterPayload(BaseModel):
    """
    Define el payload de entrada para la generación del catálogo de productos.
    Este modelo es utilizado por el endpoint de generación de catálogos y permite
    tanto la generación de catálogos completos filtrados como de catálogos
    personalizados basados en una lista específica de productos.
    """
    search_term: Optional[str] = Field(
        None,
        description="Término de búsqueda para SKU o nombre de producto en catálogos completos."
    )
    
    product_types: Optional[List[FilterType]] = Field(
        None,
        description="Lista de tipos de filtro para acotar la búsqueda en catálogos completos."
    )
    
    # --- CORRECCIÓN: Se añade el campo para catálogos personalizados ---
    product_skus: Optional[List[str]] = Field(
        None,
        description="Lista explícita de SKUs de productos para generar un catálogo personalizado. Si se proporciona, los otros filtros se ignoran."
    )

    view_type: str = Field(
        'client',
        description="Define la vista del catálogo ('client' o 'seller') para incluir o no información comercial."
    )