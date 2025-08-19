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

# Modelos y Repositorios de Proveedores
from .supplier_models import SupplierCreate, SupplierUpdate, SupplierOut, SupplierInDB
from .repositories.supplier_repository import SupplierRepository

# Modelos y Repositorios de Clientes
from .customer_models import CustomerCreate, CustomerUpdate, CustomerOut, CustomerInDB
from .repositories.customer_repository import CustomerRepository

# ==============================================================================
# SECCIÓN 2: CONSTANTES DEL MÓDULO
# ==============================================================================

SYSTEM_SUPPLIER_TAX_ID = "SYSTEM-001"

# ==============================================================================
# SECCIÓN 3: FUNCIONES DEL SERVICIO PARA PROVEEDORES
# ==============================================================================

async def get_or_create_system_supplier(db: AsyncIOMotorDatabase) -> SupplierOut:
    """Obtiene el proveedor de sistema o lo crea si no existe."""
    repo = SupplierRepository(db)
    system_supplier_doc = await repo.find_by_tax_id(SYSTEM_SUPPLIER_TAX_ID)
    
    if system_supplier_doc:
        return SupplierOut.model_validate(system_supplier_doc)
    
    system_supplier_data = SupplierCreate(
        tax_id=SYSTEM_SUPPLIER_TAX_ID,
        business_name="Inventario del Sistema",
        trade_name="Operaciones Internas",
        email="system@internal.erp",
        phone="+000000000",
        address="N/A"
    )
    return await create_supplier(db, system_supplier_data)


async def create_supplier(db: AsyncIOMotorDatabase, supplier_data: SupplierCreate) -> SupplierOut:
    """Crea un nuevo proveedor, validando que no exista previamente."""
    repo = SupplierRepository(db)

    if supplier_data.tax_id == SYSTEM_SUPPLIER_TAX_ID and not await repo.find_by_tax_id(SYSTEM_SUPPLIER_TAX_ID):
         pass
    elif supplier_data.tax_id == SYSTEM_SUPPLIER_TAX_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ID Fiscal '{SYSTEM_SUPPLIER_TAX_ID}' está reservado."
        )

    if await repo.find_by_tax_id(supplier_data.tax_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El ID Fiscal '{supplier_data.tax_id}' ya está registrado.",
        )

    supplier_to_db = SupplierInDB(**supplier_data.model_dump())
    supplier_doc = supplier_to_db.model_dump(by_alias=True)
    inserted_id = await repo.insert_one(supplier_doc)
    created_doc = await repo.find_by_id(str(inserted_id))

    if not created_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar el proveedor tras la creación.",
        )

    return SupplierOut.model_validate(created_doc)


async def get_all_suppliers_paginated(
    db: AsyncIOMotorDatabase, search: Optional[str], page: int, page_size: int
) -> Dict[str, Any]:
    """Obtiene una lista paginada de proveedores con opción de búsqueda."""
    repo = SupplierRepository(db)
    query: Dict[str, Any] = {"is_active": True}

    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"trade_name": {"$regex": search, "$options": "i"}},
            {"tax_id": {"$regex": search, "$options": "i"}},
        ]

    total_count = await repo.count_documents(query)
    skip = (page - 1) * page_size
    supplier_docs = await repo.find_all_paginated(query, skip, page_size)
    items = [SupplierOut.model_validate(doc) for doc in supplier_docs]

    return {"total_count": total_count, "items": items}

# ==============================================================================
# SECCIÓN 4: FUNCIONES DEL SERVICIO PARA CLIENTES
# ==============================================================================

async def create_customer(db: AsyncIOMotorDatabase, customer_data: CustomerCreate) -> CustomerOut:
    """
    Crea un nuevo cliente, validando que el número de documento no exista previamente.
    """
    repo = CustomerRepository(db)

    if await repo.find_by_doc_number(customer_data.doc_number):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El número de documento '{customer_data.doc_number}' ya está registrado.",
        )
    
    customer_to_db = CustomerInDB(**customer_data.model_dump())
    
    document_to_insert = customer_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = customer_to_db.id
    
    inserted_id = await repo.insert_one(document_to_insert)
    created_doc = await repo.find_by_id(str(inserted_id))

    if not created_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar el cliente tras la creación.",
        )
        
    return CustomerOut.model_validate(created_doc)


async def get_customer_by_id(db: AsyncIOMotorDatabase, customer_id: str) -> CustomerOut:
    """Obtiene un único cliente por su ID."""
    repo = CustomerRepository(db)
    customer_doc = await repo.find_by_id(customer_id)
    if not customer_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID '{customer_id}' no encontrado.",
        )
    return CustomerOut.model_validate(customer_doc)


async def get_all_customers_paginated(
    db: AsyncIOMotorDatabase, search: Optional[str], page: int, page_size: int
) -> Dict[str, Any]:
    """Obtiene una lista paginada de clientes con opción de búsqueda."""
    repo = CustomerRepository(db)
    query: Dict[str, Any] = {"is_active": True}

    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"doc_number": {"$regex": search, "$options": "i"}},
        ]

    total_count = await repo.count_documents(query)
    skip = (page - 1) * page_size
    customer_docs = await repo.find_all_paginated(query, skip, page_size)
    items = [CustomerOut.model_validate(doc) for doc in customer_docs]

    return {"total_count": total_count, "items": items}