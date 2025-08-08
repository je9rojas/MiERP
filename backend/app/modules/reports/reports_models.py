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
    
    Es un modelo flexible que permite la generación de catálogos con una
    jerarquía de filtros:
    1. Si se proporcionan SKUs, se crea un catálogo personalizado.
    2. Si no, se pueden usar filtros combinados por marca y/o tipo.
    3. Si no se proporciona ningún filtro, se genera el catálogo completo.
    """
    
    product_skus: Optional[List[str]] = Field(
        default=None,
        description="Prioridad 1: Lista explícita de SKUs para generar un catálogo personalizado. Si se proporciona, los otros filtros son ignorados."
    )

    brands: Optional[List[str]] = Field(
        default_factory=list,
        description="Prioridad 2: Lista opcional de marcas para generar un catálogo temático. Ej: ['WIX', 'Bosch']."
    )
    
    product_types: Optional[List[FilterType]] = Field(
        default_factory=list,
        description="Prioridad 2: Lista opcional de tipos de filtro para acotar la búsqueda. Se puede combinar con el filtro de marcas."
    )

    view_type: str = Field(
        'client',
        description="Define la vista del catálogo ('client' o 'seller') para incluir o no información comercial sensible."
    )