# /backend/app/modules/crm/crm_service.py

"""
Capa de Servicio para el módulo de CRM (Customer Relationship Management).

Este archivo contiene la lógica de negocio para las operaciones relacionadas con
clientes y proveedores. Actúa como un intermediario entre las rutas (la capa de API)
y los repositorios (la capa de acceso a datos), aplicando validaciones y
transformando los datos según sea necesario.
"""

# --- SECCIÓN 1: IMPORTACIONES ---

from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from typing import Dict, Any, List, Optional

# Importamos los modelos y el repositorio necesarios para proveedores.
# Es crucial importar los DTOs de entrada (Create, Update) y de salida (Out).
from .supplier_models import SupplierCreate, SupplierUpdate, SupplierOut, SupplierInDB
from .repositories.supplier_repository import SupplierRepository


# --- SECCIÓN 2: FUNCIONES DEL SERVICIO PARA PROVEEDORES ---

async def create_supplier(
    db: AsyncIOMotorDatabase,
    supplier_data: SupplierCreate
) -> SupplierOut:
    """
    Crea un nuevo proveedor en el sistema tras validar la lógica de negocio.

    Args:
        db: La instancia de la base de datos para realizar operaciones.
        supplier_data: Un objeto DTO con los datos del proveedor a crear.

    Raises:
        HTTPException(409 Conflict): Si ya existe un proveedor con el mismo RUC.
        HTTPException(500 Internal Server Error): Si ocurre un error inesperado tras la creación.

    Returns:
        Un objeto SupplierOut representando al proveedor recién creado.
    """
    # Se instancia el repositorio, inyectando la conexión a la base de datos.
    repo = SupplierRepository(db)

    # 1. Lógica de Negocio: Verificar si el proveedor ya existe.
    existing_supplier = await repo.find_by_tax_id(supplier_data.tax_id)
    
    if existing_supplier:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El ID Fiscal '{supplier_data.tax_id}' ya está registrado.",
        )

    # 2. Preparación de Datos: Convertir el DTO de entrada al modelo de la BD.
    # Se usa el modelo SupplierInDB para asegurar que todos los campos por defecto
    # (como created_at, is_active) se generen correctamente.
    supplier_to_create = SupplierInDB(**supplier_data.model_dump())

    # Se convierte el modelo Pydantic a un diccionario antes de insertarlo en MongoDB.
    supplier_doc = supplier_to_create.model_dump(by_alias=True)

    # 3. Operación de Creación: Llamar al repositorio para insertar el documento.
    inserted_id = await repo.insert_one(supplier_doc)

    # 4. Confirmación: Recuperar el documento recién creado para devolverlo.
    # Esto asegura que la respuesta contenga todos los campos generados por el servidor.
    created_supplier_doc = await repo.find_by_id(str(inserted_id))
    if not created_supplier_doc:
        # Este caso es muy raro, pero es una buena práctica de robustez manejarlo.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Se creó el proveedor, pero no se pudo recuperar de la base de datos.",
        )

    # 5. Respuesta: Devolver los datos del proveedor en el formato de salida seguro (SupplierOut).
    return SupplierOut(**created_supplier_doc)


async def get_all_suppliers_paginated(
    db: AsyncIOMotorDatabase,
    search: Optional[str],
    page: int,
    page_size: int
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada de proveedores, con opción de búsqueda por varios campos.

    Args:
        db: La instancia de la base de datos.
        search: Un término de búsqueda opcional para filtrar los resultados.
        page: El número de página a recuperar.
        page_size: El número de proveedores por página.

    Returns:
        Un diccionario que contiene el total de proveedores y la lista de proveedores de la página actual.
    """
    repo = SupplierRepository(db)

    # Define el filtro base para la consulta.
    query: Dict[str, Any] = {"is_active": True}

    # Si se proporciona un término de búsqueda, se añade un filtro '$or' a la consulta.
    # El filtro busca coincidencias (insensibles a mayúsculas) en varios campos.
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"trade_name": {"$regex": search, "$options": "i"}},
            {"ruc": {"$regex": search, "$options": "i"}},
        ]

    # Calcula el número de documentos a omitir (skip) para la paginación.
    skip = (page - 1) * page_size

    # Obtiene el número total de documentos que coinciden con la consulta (sin paginación).
    total_count = await repo.count_documents(query)

    # Obtiene la lista de documentos de proveedores para la página actual.
    supplier_docs = await repo.find_all_paginated(query, skip, page_size)

    # Convierte la lista de documentos de MongoDB a una lista de modelos Pydantic SupplierOut.
    items = [SupplierOut(**doc) for doc in supplier_docs]

    # Devuelve el resultado en un formato estructurado para paginación.
    return {"total_count": total_count, "items": items}