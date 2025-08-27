# /backend/app/modules/purchasing/goods_receipt_service.py

"""
Capa de Servicio para la Lógica de Negocio de las Recepciones de Mercancía.

Este módulo se especializa en gestionar las Recepciones de Mercancía (Goods Receipts),
una etapa clave en el flujo "Procure-to-Pay". Su responsabilidad principal es
orquestar la creación de recepciones, lo que implica una operación transaccional
que afecta a múltiples partes del sistema.

Responsabilidades Clave:
- Crear registros de recepción de mercancía, validando contra la Orden de Compra original.
- Coordinar con el `InventoryService` para incrementar el stock físico y crear los lotes
  de inventario correspondientes.
- Determinar el nuevo estado de la Orden de Compra (ej. 'Parcialmente Recibida' o
  'Totalmente Recibida') basado en las cantidades recibidas.
- Delegar la actualización del estado de la Orden de Compra al `PurchaseOrderService`,
  manteniendo una clara separación de responsabilidades (SoC).
- Proveer métodos de consulta para obtener recepciones individuales o listas paginadas.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.core.services.document_numbering_service import generate_sequential_number
from app.models.shared import PyObjectId
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.inventory import inventory_service
from app.modules.purchasing import purchase_order_service
from app.modules.purchasing.purchasing_models import (
    GoodsReceiptCreate,
    GoodsReceiptInDB,
    GoodsReceiptOut,
    PurchaseOrderStatus
)
from app.modules.purchasing.repositories.goods_receipt_repository import GoodsReceiptRepository
from app.modules.purchasing.repositories.purchase_order_repository import PurchaseOrderRepository
from app.modules.shared.utils.population_utils import populate_documents_with_supplier_info
from app.modules.users.user_models import UserOut

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)


# ==============================================================================
# SECCIÓN 3: SERVICIOS PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

async def create_goods_receipt(
    db: AsyncIOMotorDatabase,
    receipt_data: GoodsReceiptCreate,
    current_user: UserOut
) -> GoodsReceiptOut:
    """
    Crea una nueva Recepción de Mercancía dentro de una transacción de base de datos.

    Esta operación es atómica: o se completan todos los pasos (crear recepción,
    actualizar stock, actualizar estado de la OC) o no se realiza ninguno.

    Args:
        db: Conexión a la base de datos.
        receipt_data: Datos de la nueva recepción.
        current_user: Usuario que realiza la operación.

    Returns:
        La recepción de mercancía creada y poblada.

    Raises:
        HTTPException 404: Si la Orden de Compra de origen no existe.
        HTTPException 409: Si la Orden de Compra no está en un estado válido para ser recibida.
        HTTPException 500: Si la transacción falla y no se puede crear la recepción.
    """
    po_repo = PurchaseOrderRepository(db)
    receipt_repo = GoodsReceiptRepository(db)
    inserted_id: Optional[PyObjectId] = None

    async with await db.client.start_session() as session:
        async with session.start_transaction():
            # 1. Obtener y validar la Orden de Compra de origen
            po_doc = await po_repo.find_one_by_id(str(receipt_data.purchase_order_id), session=session)
            if not po_doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La Orden de Compra de origen no existe."
                )
            
            po_status = PurchaseOrderStatus(po_doc.get("status"))
            valid_statuses = [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED]
            if po_status not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Solo se pueden recibir órdenes 'Confirmadas' o 'Parcialmente Recibidas'."
                )

            # 2. Preparar y crear el documento de Recepción de Mercancía
            sequential_number = await generate_sequential_number(receipt_repo, "RM", "receipt_number")
            
            receipt_to_db = GoodsReceiptInDB(
                **receipt_data.model_dump(),
                receipt_number=sequential_number,
                supplier_id=po_doc["supplier_id"],
                created_by_id=current_user.id
            )
            doc_to_insert = receipt_to_db.model_dump(by_alias=True, exclude={'id'})
            inserted_id = await receipt_repo.insert_one(doc_to_insert, session=session)
            
            # 3. Orquestar la actualización del inventario (delegando al servicio de inventario)
            await inventory_service.add_stock_from_goods_receipt(
                database=db,
                receipt=receipt_to_db,
                purchase_order_doc=po_doc,
                session=session
            )
            
            # 4. Calcular el nuevo estado de la OC y delegar su actualización
            new_po_status = await _calculate_new_po_status_after_receipt(db, po_doc["_id"], session)
            
            await purchase_order_service.update_purchase_order_status(
                db=db,
                order_id=str(po_doc["_id"]),
                new_status=new_po_status,
                receipt_id=inserted_id
            )
    
    if not inserted_id:
        # Este caso ocurriría si la transacción falla por alguna razón inesperada.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error transaccional: no se pudo crear la recepción de mercancía."
        )
        
    return await get_goods_receipt_by_id(db, str(inserted_id))


async def get_goods_receipt_by_id(db: AsyncIOMotorDatabase, receipt_id: str) -> GoodsReceiptOut:
    """
    Obtiene una única Recepción de Mercancía por su ID.

    Args:
        db: Conexión a la base de datos.
        receipt_id: El ID de la recepción a buscar.

    Returns:
        La recepción encontrada y poblada con datos del proveedor.

    Raises:
        HTTPException 404: Si no se encuentra la recepción.
    """
    repo = GoodsReceiptRepository(db)
    doc = await repo.find_one_by_id(receipt_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recepción de Mercancía con ID '{receipt_id}' no encontrada."
        )
    
    supplier_repo = SupplierRepository(db)
    populated_list = await populate_documents_with_supplier_info(
        db, [doc], supplier_repo, GoodsReceiptOut
    )
    return populated_list[0]


async def get_goods_receipts_paginated(
    db: AsyncIOMotorDatabase,
    page: int,
    page_size: int,
    search: Optional[str]
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada de Recepciones de Mercancía.

    Permite una búsqueda simple por el número de recepción.

    Args:
        db: Conexión a la base de datos.
        page: Número de página a obtener.
        page_size: Tamaño de la página.
        search: Término de búsqueda opcional.

    Returns:
        Un diccionario con el conteo total y la lista de recepciones.
    """
    repo = GoodsReceiptRepository(db)
    query = {"receipt_number": {"$regex": search, "$options": "i"}} if search else {}
    
    total_count = await repo.count_documents(query)
    docs = await repo.find_all_paginated(
        query=query,
        skip=(page - 1) * page_size,
        limit=page_size,
        sort=[("received_date", DESCENDING)]
    )
    
    supplier_repo = SupplierRepository(db)
    items = await populate_documents_with_supplier_info(db, docs, supplier_repo, GoodsReceiptOut)
    
    return {"total_count": total_count, "items": items}


# ==============================================================================
# SECCIÓN 4: FUNCIONES AUXILIARES PRIVADAS
# ==============================================================================

async def _calculate_new_po_status_after_receipt(
    db: AsyncIOMotorDatabase,
    po_id: PyObjectId,
    session: Optional[AsyncIOMotorClientSession] = None
) -> PurchaseOrderStatus:
    """
    Calcula el estado de una Orden de Compra basado en sus recepciones.

    Compara la cantidad total pedida de cada ítem en la OC con la cantidad
    total recibida a través de todas sus recepciones asociadas.

    Args:
        db: Conexión a la base de datos.
        po_id: El ID de la Orden de Compra a evaluar.
        session: La sesión de la transacción de base de datos activa.

    Returns:
        El nuevo estado calculado para la Orden de Compra.

    Raises:
        ValueError: Si la OC no se encuentra durante el cálculo.
    """
    po_repo = PurchaseOrderRepository(db)
    receipt_repo = GoodsReceiptRepository(db)
    
    po_doc = await po_repo.find_one_by_id(str(po_id), session=session)
    if not po_doc:
        # Esta excepción debería ser capturada por el rollback de la transacción.
        raise ValueError(f"Orden de Compra con ID {po_id} no encontrada durante recálculo de estado.")
    
    all_receipts = await receipt_repo.find_all_by_purchase_order_id(str(po_id), session=session)
    
    # Acumular el total recibido por cada producto a través de todas las recepciones
    total_received_per_product = defaultdict(int)
    for receipt in all_receipts:
        for item in receipt.get("items", []):
            total_received_per_product[str(item.get("product_id"))] += item.get("quantity_received", 0)
    
    # Verificar si todos los ítems de la OC han sido completamente recibidos
    is_fully_received = all(
        total_received_per_product.get(str(po_item["product_id"]), 0) >= po_item["quantity_ordered"]
        for po_item in po_doc["items"]
    )
    
    return PurchaseOrderStatus.FULLY_RECEIVED if is_fully_received else PurchaseOrderStatus.PARTIALLY_RECEIVED