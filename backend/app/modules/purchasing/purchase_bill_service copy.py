# /backend/app/modules/purchasing/purchase_bill_service.py

"""
Capa de Servicio para la Lógica de Negocio de las Facturas de Compra.

Este módulo se encarga exclusivamente de la gestión de las Facturas de Compra
(Purchase Bills). Representa el componente financiero del flujo "Procure-to-Pay",
y su lógica está desacoplada de las operaciones de inventario y acuerdos de compra.

Responsabilidades Clave:
- Creación de nuevas facturas de compra, asociándolas a una Orden de Compra existente.
- Cálculo del monto total de la factura basado en sus ítems.
- Generación de un número de factura interno secuencial.
- Provisión de métodos de consulta para obtener facturas individuales o listas
  paginadas, permitiendo la búsqueda por número de factura interno o del proveedor.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.core.services.document_numbering_service import generate_sequential_number
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.purchasing.purchasing_models import (
    PurchaseBillCreate,
    PurchaseBillInDB,
    PurchaseBillOut,
)
from app.modules.purchasing.repositories.purchase_bill_repository import PurchaseBillRepository
from app.modules.purchasing.repositories.purchase_order_repository import PurchaseOrderRepository
from app.modules.shared.utils.population_utils import populate_documents_with_supplier_info
from app.modules.users.user_models import UserOut

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)


# ==============================================================================
# SECCIÓN 3: SERVICIOS PARA FACTURAS DE COMPRA (PURCHASE BILL)
# ==============================================================================

async def create_purchase_bill(
    db: AsyncIOMotorDatabase,
    bill_data: PurchaseBillCreate,
    current_user: UserOut
) -> PurchaseBillOut:
    """
    Crea una nueva Factura de Compra.

    Args:
        db: Conexión a la base de datos.
        bill_data: Datos de la nueva factura.
        current_user: Usuario que realiza la operación.

    Returns:
        La factura de compra creada y poblada con los datos del proveedor.

    Raises:
        HTTPException 404: Si la Orden de Compra asociada no existe.
    """
    bill_repo = PurchaseBillRepository(db)
    po_repo = PurchaseOrderRepository(db)
    
    # 1. Validar la existencia de la Orden de Compra asociada.
    po_doc = await po_repo.find_one_by_id(str(bill_data.purchase_order_id))
    if not po_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La Orden de Compra asociada no existe."
        )
    
    # 2. Calcular el total y preparar el documento para la base de datos.
    total = sum(item.subtotal for item in bill_data.items)
    sequential_number = await generate_sequential_number(bill_repo, "FC", "bill_number")
    
    bill_to_db = PurchaseBillInDB(
        **bill_data.model_dump(),
        bill_number=sequential_number,
        supplier_id=po_doc.get("supplier_id"),
        created_by_id=current_user.id,
        total_amount=round(total, 2)
    )
    
    # 3. Insertar en la base de datos.
    doc_to_insert = bill_to_db.model_dump(by_alias=True, exclude={'id'})
    inserted_id = await bill_repo.insert_one(doc_to_insert)
    
    # 4. Devolver el documento recién creado y poblado.
    return await get_purchase_bill_by_id(db, str(inserted_id))


async def get_purchase_bill_by_id(db: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    """
    Obtiene una única Factura de Compra por su ID.

    Args:
        db: Conexión a la base de datos.
        bill_id: El ID de la factura a buscar.

    Returns:
        La factura encontrada y poblada con los datos del proveedor.

    Raises:
        HTTPException 404: Si la factura no se encuentra.
    """
    repo = PurchaseBillRepository(db)
    doc = await repo.find_one_by_id(bill_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Factura de Compra con ID '{bill_id}' no encontrada."
        )
    
    supplier_repo = SupplierRepository(db)
    populated_list = await populate_documents_with_supplier_info(
        db, [doc], supplier_repo, PurchaseBillOut
    )
    return populated_list[0]


async def get_purchase_bills_paginated(
    db: AsyncIOMotorDatabase,
    page: int,
    page_size: int,
    search: Optional[str]
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada de Facturas de Compra.

    Permite buscar por el número de factura interno o el número de factura
    proporcionado por el proveedor.

    Args:
        db: Conexión a la base de datos.
        page: Número de página a obtener.
        page_size: Tamaño de la página.
        search: Término de búsqueda opcional.

    Returns:
        Un diccionario con el conteo total y la lista de facturas.
    """
    repo = PurchaseBillRepository(db)
    query = {}
    if search:
        query["$or"] = [
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"supplier_invoice_number": {"$regex": search, "$options": "i"}}
        ]
        
    total_count = await repo.count_documents(query)
    docs = await repo.find_all_paginated(
        query=query,
        skip=(page - 1) * page_size,
        limit=page_size,
        sort=[("invoice_date", DESCENDING)]
    )
    
    supplier_repo = SupplierRepository(db)
    items = await populate_documents_with_supplier_info(db, docs, supplier_repo, PurchaseBillOut)
    
    return {"total_count": total_count, "items": items}