# /backend/app/modules/purchasing/purchasing_service.py

"""
Capa de servicio para la lógica de negocio del módulo de Compras.
Este archivo orquesta las operaciones, valida los datos de entrada,
enriquece la información y coordina los repositorios para interactuar con la base de datos.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId

# --- Dependencias de Repositorios ---
from .repositories.purchase_order_repository import PurchaseOrderRepository
from .repositories.invoice_repository import InvoiceRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.supplier_repository import SupplierRepository

# --- Dependencias de Modelos ---
from app.modules.users.user_models import UserOut
from .purchase_order_models import (
    PurchaseOrderCreate,
    PurchaseOrderItem,
    PurchaseOrderInDB,
    PurchaseOrderOut,
    PurchaseOrderStatus,
    PurchaseInvoiceInDB,
    PurchaseInvoiceOut
)

async def get_purchase_orders_with_filters(
    db: AsyncIOMotorDatabase,
    search: Optional[str],
    status: Optional[str],
    page: int,
    page_size: int,
) -> Dict[str, Any]:
    """
    Recupera una lista paginada y filtrada de órdenes de compra.

    Args:
        db: Instancia de la base de datos.
        search: Término de búsqueda para el número de orden o el nombre del proveedor.
        status: Estado de la orden de compra para filtrar.
        page: Número de página actual.
        page_size: Número de elementos por página.

    Returns:
        Un diccionario con el conteo total de documentos y la lista de órdenes de la página.
    """
    po_repo = PurchaseOrderRepository(db)
    query = {}
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"supplier_name": {"$regex": search, "$options": "i"}},
        ]
    if status:
        query["status"] = status
        
    total_count = await po_repo.count_documents(query)
    skip = (page - 1) * page_size
    po_docs = await po_repo.find_all_paginated(query, skip, page_size)
    
    items = [PurchaseOrderOut(**doc) for doc in po_docs]
    return {"total": total_count, "items": items}

async def create_purchase_order(db: AsyncIOMotorDatabase, po_data: PurchaseOrderCreate, user: UserOut) -> PurchaseOrderOut:
    """
    Crea una nueva orden de compra, validando y enriqueciendo los datos.

    Args:
        db: Instancia de la base de datos.
        po_data: DTO de entrada con los datos de la orden de compra.
        user: El usuario autenticado que realiza la operación.

    Returns:
        El objeto completo de la orden de compra creada.
    """
    po_repo = PurchaseOrderRepository(db)
    product_repo = ProductRepository(db)
    supplier_repo = SupplierRepository(db)
    
    supplier = await supplier_repo.find_by_id(po_data.supplier_id)
    if not supplier:
        raise ValueError("El proveedor especificado no existe.")

    enriched_items = []
    subtotal = 0.0
    for item_data in po_data.items:
        product = await product_repo.find_by_id(item_data.product_id)
        if not product:
            raise ValueError(f"El producto con ID '{item_data.product_id}' no existe.")
        
        item_subtotal = item_data.quantity * item_data.unit_cost
        subtotal += item_subtotal
        
        enriched_items.append(PurchaseOrderItem(
            product_id=ObjectId(item_data.product_id),
            product_sku=product.get('sku', 'N/A'),
            product_name=product.get('name', 'N/A'),
            quantity=item_data.quantity,
            unit_cost=item_data.unit_cost,
            subtotal=item_subtotal
        ))

    tax_rate = 0.18
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount

    po_to_db = PurchaseOrderInDB(
        order_number=f"PO-{int(datetime.now(timezone.utc).timestamp())}",
        supplier_id=ObjectId(po_data.supplier_id),
        supplier_name=supplier.get('business_name', 'Nombre no encontrado'),
        order_date=po_data.order_date,
        expected_delivery_date=po_data.expected_delivery_date,
        notes=po_data.notes,
        items=enriched_items,
        status=PurchaseOrderStatus.PENDING_APPROVAL,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        created_by_id=user.id
    )
    
    inserted_id = await po_repo.insert_one(po_to_db.model_dump(by_alias=True))
    created_po_doc = await po_repo.find_by_id(str(inserted_id))
    
    return PurchaseOrderOut(**created_po_doc)


async def approve_po_and_create_invoice(db: AsyncIOMotorDatabase, po_id: str, user: UserOut) -> PurchaseInvoiceOut:
    """
    Aprueba una orden de compra y crea la factura correspondiente de forma atómica.

    Args:
        db: Instancia de la base de datos.
        po_id: El ID de la orden de compra a aprobar.
        user: El usuario (gerente/admin) que aprueba la orden.

    Returns:
        El objeto completo de la factura de compra recién creada.
    """
    po_repo = PurchaseOrderRepository(db)
    invoice_repo = InvoiceRepository(db)
    po_object_id = ObjectId(po_id)
    
    async with await db.client.start_session() as session:
        async with session.with_transaction():
            po_doc = await po_repo.find_by_id(po_id, session=session)
            if not po_doc:
                raise ValueError("La orden de compra no existe.")
            
            po = PurchaseOrderInDB(**po_doc)
            if po.status != PurchaseOrderStatus.PENDING_APPROVAL:
                raise ValueError(f"La orden no puede ser aprobada. Estado actual: {po.status.value}")

            update_data = {
                "status": PurchaseOrderStatus.APPROVED,
                "approved_by_id": user.id,
                "updated_at": datetime.now(timezone.utc)
            }
            await po_repo.update_one(po_object_id, update_data, session=session)

            invoice_to_db = PurchaseInvoiceInDB(
                purchase_order_id=po.id,
                supplier_id=po.supplier_id,
                supplier_name=po.supplier_name,
                invoice_number=f"INV-{po.order_number}",
                issue_date=datetime.now(timezone.utc),
                due_date=datetime.now(timezone.utc) + timedelta(days=30),
                items=po.items,
                subtotal=po.subtotal,
                tax_amount=po.tax_amount,
                total_amount=po.total_amount
            )
            
            inserted_id = await invoice_repo.insert_one(invoice_to_db.model_dump(by_alias=True), session=session)
            created_invoice_doc = await invoice_repo.find_by_id(str(inserted_id), session=session)

            return PurchaseInvoiceOut(**created_invoice_doc)