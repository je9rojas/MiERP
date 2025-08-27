# /backend/app/modules/shared/utils/population_utils.py

"""
Utilidades Compartidas para el "Poblado" de Datos en Documentos.

"Poblar" se refiere al proceso de reemplazar un campo de ID en un documento
(ej. `supplier_id`) con el objeto completo del documento relacionado
(ej. el objeto del proveedor). Este módulo centraliza esta lógica para
evitar su repetición en cada capa de servicio.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from typing import Any, Dict, List, Type

from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.crm.supplier_models import SupplierOut


# ==============================================================================
# SECCIÓN 2: FUNCIONES DE UTILIDAD
# ==============================================================================

async def populate_documents_with_supplier_info(
    db: AsyncIOMotorDatabase,
    documents: List[Dict[str, Any]],
    supplier_repo: SupplierRepository,
    PydanticOutModel: Type[BaseModel]
) -> List[BaseModel]:
    """
    Enriquece una lista de documentos con la información completa de sus proveedores.

    Esta función es altamente eficiente:
    1. Recolecta todos los IDs de proveedor únicos de la lista de documentos.
    2. Realiza UNA ÚNICA consulta a la base de datos para obtener todos los proveedores necesarios.
    3. Mapea los resultados para una búsqueda rápida en memoria.
    4. Itera sobre los documentos originales y adjunta el objeto de proveedor correspondiente.

    Args:
        db: Conexión a la base de datos (actualmente no usada pero guardada para futura flexibilidad).
        documents: La lista de documentos a poblar (ej. órdenes, facturas).
        supplier_repo: Instancia del repositorio de proveedores para buscar los datos.
        PydanticOutModel: El modelo Pydantic de salida (ej. PurchaseOrderOut)
                          para validar la estructura final.

    Returns:
        Una lista de modelos Pydantic validados con el campo 'supplier' poblado.
    """
    # 1. Recolectar IDs únicos para minimizar las llamadas a la BD.
    supplier_ids = {str(doc["supplier_id"]) for doc in documents if doc.get("supplier_id")}
    
    if not supplier_ids:
        # Si no hay proveedores que poblar, simplemente validar y devolver.
        return [PydanticOutModel.model_validate(doc) for doc in documents]

    # 2. Obtener todos los proveedores necesarios en una sola consulta.
    suppliers_list = await supplier_repo.find_by_ids(list(supplier_ids))
    
    # 3. Crear un mapa para una búsqueda O(1) en memoria.
    suppliers_map = {
        str(supplier['_id']): SupplierOut.model_validate(supplier)
        for supplier in suppliers_list
    }

    # 4. Construir la lista de resultados poblados.
    populated_items = []
    for doc in documents:
        supplier_object = suppliers_map.get(str(doc.get("supplier_id")))
        
        populated_doc = doc.copy()
        populated_doc["supplier"] = supplier_object
        
        populated_items.append(PydanticOutModel.model_validate(populated_doc))
            
    return populated_items