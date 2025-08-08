# backend/app/modules/reports/reports_models.py

"""
Define los modelos de datos de Pydantic para el módulo de Reportes.

Este archivo contiene los modelos que definen las estructuras de datos de entrada
(payloads de filtros) para la generación de los diferentes reportes del sistema.
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

    Permite la generación de catálogos filtrados por tipo de producto y/o por marcas.
    Si no se proporciona ningún filtro, se genera el catálogo completo.
    """
    
    brands: Optional[List[str]] = Field(
        default_factory=list,
        description="Lista opcional de marcas para generar un catálogo temático. Ej: ['WIX', 'Bosch']"
    )
    
    product_types: Optional[List[FilterType]] = Field(
        default_factory=list,
        description="Lista opcional de tipos de filtro para acotar aún más la búsqueda."
    )

    view_type: str = Field(
        'client',
        description="Define la vista del catálogo ('client' o 'seller') para incluir o no información comercial sensible."
    )