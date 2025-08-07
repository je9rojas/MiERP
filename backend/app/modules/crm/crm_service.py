# backend/app/modules/crm/crm_service.py

"""
Capa de Servicio para el módulo de CRM (Customer Relationship Management).

Este archivo contiene la lógica de negocio para las operaciones relacionadas con
clientes y proveedores. Actúa como un intermediario entre las rutas (la capa de API)
y los repositorios (la capa de acceso a datos), aplicando validaciones y
transformando los datos según sea necesario.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from typing import Dict, Any, List, Optional

from .supplier_models import SupplierCreate, SupplierUpdate, SupplierOut, SupplierInDB
from .repositories.supplier_repository import SupplierRepository

# ==============================================================================
# SECCIÓN 2: CONSTANTES DEL MÓDULO
# ==============================================================================

# Identificador único para el proveedor del sistema usado en operaciones internas.
SYSTEM_SUPPLIER_TAX_ID = "SYSTEM-001"


# ==============================================================================
# SECCIÓN 3: FUNCIONES DEL SERVICIO PARA PROVEEDORES
# ==============================================================================

async def get_or_create_system_supplier(db: AsyncIOMotorDatabase) -> SupplierOut:
    """
    Obtiene el proveedor de sistema para operaciones internas, o lo crea si no existe.

    Este proveedor se utiliza para transacciones generadas por el sistema, como la
    carga de inventario inicial, asegurando la trazabilidad. La función es idempotente.

    Args:
        db: La instancia de la base de datos para realizar operaciones.

    Returns:
        Un objeto SupplierOut representando al proveedor del sistema.
    """
    repo = SupplierRepository(db)
    
    # Intenta encontrar el proveedor del sistema por su ID Fiscal único.
    system_supplier_doc = await repo.find_by_tax_id(SYSTEM_SUPPLIER_TAX_ID)
    
    if system_supplier_doc:
        # Si ya existe, lo devuelve.
        return SupplierOut(**system_supplier_doc)
    
    # Si no existe, define los datos para crearlo.
    system_supplier_data = SupplierCreate(
        tax_id=SYSTEM_SUPPLIER_TAX_ID,
        business_name="Inventario del Sistema",
        trade_name="Operaciones Internas",
        email="system@internal.erp",
        phone="+000000000",
        address="N/A"
    )
    
    # Llama a la función de creación estándar para registrarlo.
    # Se reutiliza la lógica existente para mantener la consistencia.
    return await create_supplier(db, system_supplier_data)


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
    repo = SupplierRepository(db)

    # Evita que se cree manualmente un proveedor con el ID reservado del sistema.
    if supplier_data.tax_id == SYSTEM_SUPPLIER_TAX_ID and not await repo.find_by_tax_id(SYSTEM_SUPPLIER_TAX_ID):
         pass  # Permite la creación solo si es la primera vez (llamado desde get_or_create_system_supplier)
    elif supplier_data.tax_id == SYSTEM_SUPPLIER_TAX_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ID Fiscal '{SYSTEM_SUPPLIER_TAX_ID}' está reservado para uso del sistema."
        )

    existing_supplier = await repo.find_by_tax_id(supplier_data.tax_id)
    if existing_supplier:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El ID Fiscal '{supplier_data.tax_id}' ya está registrado.",
        )

    supplier_to_create = SupplierInDB(**supplier_data.model_dump())
    supplier_doc = supplier_to_create.model_dump(by_alias=True)
    inserted_id = await repo.insert_one(supplier_doc)
    created_supplier_doc = await repo.find_by_id(str(inserted_id))

    if not created_supplier_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Se creó el proveedor, pero no se pudo recuperar de la base de datos.",
        )

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
    query: Dict[str, Any] = {"is_active": True}

    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"trade_name": {"$regex": search, "$options": "i"}},
            {"tax_id": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * page_size
    total_count = await repo.count_documents(query)
    supplier_docs = await repo.find_all_paginated(query, skip, page_size)
    items = [SupplierOut(**doc) for doc in supplier_docs]

    return {"total_count": total_count, "items": items}