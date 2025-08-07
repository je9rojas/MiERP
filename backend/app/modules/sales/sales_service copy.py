# /backend/app/modules/sales/sales_service.py

"""
Capa de Servicio para la lógica de negocio del módulo de Ventas.

Este módulo orquesta las operaciones de las órdenes de venta, incluyendo la
validación de datos, el enriquecimiento de ítems con precios actuales,
la coordinación con el servicio de inventario para el despacho de stock,
y el registro final de la venta de forma transaccional.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
import logging

# Repositorios
from .repositories.sales_repository import SalesOrderRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.customer_repository import CustomerRepository

# Modelos
from app.modules.users.user_models import UserOut
from .sales_models import SalesOrderCreate, SalesOrderItem, SalesOrderInDB, SalesOrderOut

# Servicios
from app.modules.inventory import inventory_service

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _validate_and_enrich_sale_items(
    db: AsyncIOMotorDatabase, items_data: List
) -> (List[SalesOrderItem], float):
    """
    Valida productos, enriquece los ítems con el precio de venta actual y calcula el total.
    """
    product_repo = ProductRepository(db)
    enriched_items = []
    total_amount = 0.0

    for item_in in items_data:
        product_doc = await product_repo.find_by_id(str(item_in.product_id))
        if not product_doc or not product_doc.get("is_active"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El producto con ID '{item_in.product_id}' no existe o está inactivo.")
        
        unit_price = product_doc.get("price", 0.0)
        item_subtotal = item_in.quantity * unit_price
        total_amount += item_subtotal
        
        enriched_item = SalesOrderItem(
            product_id=item_in.product_id,
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "Producto no encontrado"),
            quantity=item_in.quantity,
            unit_price=unit_price,
            subtotal=round(item_subtotal, 2)
        )
        enriched_items.append(enriched_item)
        
    return enriched_items, total_amount

async def _generate_so_number(db: AsyncIOMotorDatabase) -> str:
    """Genera un número de orden de venta único."""
    timestamp = int(datetime.now(timezone.utc).timestamp())
    # En producción, esto debería usar un contador atómico de MongoDB.
    return f"OV-{timestamp}"

# ==============================================================================
# SECCIÓN 3: FUNCIÓN PÚBLICA DEL SERVICIO
# ==============================================================================

async def create_sales_order(db: AsyncIOMotorDatabase, so_data: SalesOrderCreate, user: UserOut) -> SalesOrderOut:
    """
    Crea una nueva Orden de Venta y gestiona el despacho de inventario de forma atómica.
    """
    so_repo = SalesOrderRepository(db)
    customer_repo = CustomerRepository(db)
    
    # Inicia una sesión de cliente para la transacción
    async with await db.client.start_session() as session:
        # Inicia la transacción
        async with session.with_transaction():
            try:
                # 1. Validar que el cliente exista (dentro de la transacción)
                customer_doc = await customer_repo.find_by_id(str(so_data.customer_id), session=session)
                if not customer_doc:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente especificado no existe.")

                # 2. Validar y enriquecer los ítems
                enriched_items, total_amount = await _validate_and_enrich_sale_items(db, so_data.items)

                # 3. Despachar el stock del inventario (PEPS/FIFO)
                # Esta operación ahora ocurre dentro de la transacción.
                await inventory_service.dispatch_stock_for_sale(db, enriched_items, session=session)

                # 4. Generar el número de orden de venta
                order_number = await _generate_so_number(db)

                # 5. Construir el documento para la base de datos
                so_to_db = SalesOrderInDB(
                    order_number=order_number,
                    customer_id=so_data.customer_id,
                    created_by_id=user.id,
                    order_date=so_data.order_date,
                    notes=so_data.notes,
                    shipping_address=so_data.shipping_address,
                    items=enriched_items,
                    total_amount=round(total_amount, 2),
                )

                # 6. Insertar la orden de venta (dentro de la transacción)
                inserted_id = await so_repo.insert_one(so_to_db.model_dump(by_alias=True), session=session)
                created_so_doc = await so_repo.find_by_id(str(inserted_id), session=session)

                # 7. Preparar la respuesta final
                created_so_doc['customer'] = customer_doc
                return SalesOrderOut.model_validate(created_so_doc)

            except HTTPException as http_exc:
                # Si una excepción HTTP conocida ocurre (ej. stock insuficiente), se relanza.
                # La transacción se revertirá automáticamente al salir del bloque 'with'.
                raise http_exc
            except Exception as e:
                # Para cualquier otro error inesperado, se loguea y se lanza un 500.
                logger.error(f"Error inesperado durante la creación de la orden de venta: {e}")
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocurrió un error interno al procesar la venta.")