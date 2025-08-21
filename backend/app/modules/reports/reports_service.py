# /backend/app/modules/reports/reports_service.py

"""
Capa de Servicio para el módulo de Reportes.

Este módulo centraliza la lógica de negocio para la generación de todos los
reportes del sistema. Orquesta la obtención de datos desde diferentes
repositorios y utiliza servicios generadores específicos para producir
los archivos finales (ej. PDF).
"""

# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# SECTION 1: IMPORTACIONES
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any, List, Tuple
from io import BytesIO
from bson import ObjectId
import pprint

from app.core.config import settings
from .reports_models import CatalogFilterPayload
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.sales.repositories.sales_repository import SalesOrderRepository
from .services.catalog_service import CatalogPDFGenerator
from .services.sales_order_service import SalesOrderPDFService

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# SECTION 2: FUNCIONES DEL SERVICIO DE REPORTES
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

async def generate_sales_order_document_pdf(
    db: AsyncIOMotorDatabase, 
    order_id: str
) -> Optional[Tuple[bytes, str]]:
    """
    Orquesta la generación de un documento PDF para una Orden de Venta.

    Devuelve una tupla con el contenido del PDF en bytes y un nombre de
    archivo sugerido y dinámico.
    """
    sales_repo = SalesOrderRepository(db)
    
    pipeline = [
        # 1. Encontrar la orden de venta específica por su ID.
        {'$match': {'_id': ObjectId(order_id)}},
        
        # 2. (CORRECCIÓN DEFINITIVA) Convertir 'customer_id' a ObjectId.
        #    Se crea un nuevo campo 'customer_obj_id' para usar en el join.
        {'$addFields': {'customer_obj_id': {'$toObjectId': '$customer_id'}}},
        
        # 3. Realizar el 'join' con la colección de clientes.
        {
            '$lookup': {
                'from': 'customers',
                'localField': 'customer_obj_id', # Usar el campo convertido
                'foreignField': '_id',
                'as': 'customer_full'
            }
        },
        
        # 4. Desglosar el resultado del lookup.
        {'$unwind': {'path': '$customer_full', 'preserveNullAndEmptyArrays': True}},
        
        # 5. Guardar el estado actual del documento.
        {'$addFields': {'root_doc': '$$ROOT'}},
        
        # 6. Desglosar el array de ítems.
        {'$unwind': '$items'},
        
        # 7. Convertir el 'product_id' a ObjectId.
        {'$addFields': {'items.product_obj_id': {'$toObjectId': '$items.product_id'}}},
        
        # 8. Realizar el 'join' con la colección de productos.
        {
            '$lookup': {
                'from': 'products',
                'localField': 'items.product_obj_id',
                'foreignField': '_id',
                'as': 'items.product_details'
            }
        },
        
        # 9. Desglosar el resultado del lookup.
        {'$unwind': {'path': '$items.product_details', 'preserveNullAndEmptyArrays': True}},
        
        # 10. Re-agrupar el documento.
        {
            '$group': {
                '_id': '$_id',
                'items': {'$push': '$items'},
                'root_doc': {'$first': '$root_doc'}
            }
        },
        
        # 11. Reconstruir el documento final.
        {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [
                        '$root_doc', 
                        {'items': '$items', 'customer': '$root_doc.customer_full'}
                    ]
                }
            }
        }
    ]
    
    print("\n--- [DEBUG] INICIANDO GENERACIÓN DE PDF PARA ORDEN ---")
    print(f"ID de Orden Solicitado: {order_id}")
    print("Pipeline de Agregación a ejecutar:")
    pprint.pprint(pipeline)
    
    order_data_list = await sales_repo.aggregate(pipeline)
    
    print("\n--- [DEBUG] RESULTADO DE LA AGREGACIÓN ---")
    if not order_data_list:
        print("La consulta de agregación NO devolvió ningún documento.")
    else:
        print(f"La consulta devolvió {len(order_data_list)} documento(s).")
        print("Contenido del primer documento (order_data):")
        pprint.pprint(order_data_list[0])
    print("--- [DEBUG] FIN DEL REPORTE DE AGREGACIÓN ---\n")

    if not order_data_list:
        return None
    
    order_data = order_data_list[0]

    document_title = "Proforma" if order_data.get('status') == 'draft' else "Orden de Venta"
    order_number = order_data.get('order_number', 'SIN_NUMERO')
    filename = f"{document_title.replace(' ', '_')}_{order_number}.pdf"
    
    company_info = {
        "name": settings.COMPANY_NAME,
        "ruc": settings.COMPANY_RUC,
        "address": settings.COMPANY_ADDRESS,
        "phone": settings.COMPANY_PHONE,
        "email": settings.COMPANY_EMAIL,
    }

    pdf_service = SalesOrderPDFService(
        order_data=order_data, 
        document_title=document_title,
        company_info=company_info
    )
    
    pdf_buffer = pdf_service.generate_pdf()
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    
    return (pdf_bytes, filename)


async def generate_product_catalog_pdf(
    db: AsyncIOMotorDatabase, 
    filters: CatalogFilterPayload
) -> Optional[Tuple[bytes, str]]:
    """
    Orquesta la generación de un catálogo de productos en formato PDF.
    """
    product_repo = ProductRepository(db)
    product_docs: List[Dict[str, Any]] = []

    if filters.product_skus:
        found_docs = await product_repo.find_by_skus(filters.product_skus)
        sku_map = {doc['sku']: doc for doc in found_docs}
        product_docs = [sku_map[sku] for sku in filters.product_skus if sku in sku_map]
    else:
        query: Dict[str, Any] = {"is_active": True}
        if filters.brands:
            query["brand"] = {"$in": filters.brands}
        if filters.product_types:
            query["product_type"] = {"$in": [pt.value for pt in filters.product_types]}
        product_docs = await product_repo.find_all(query)
        product_docs.sort(key=lambda p: p.get('sku', ''))

    if not product_docs:
        return None
        
    company_info = {
        "name": settings.COMPANY_NAME,
        "ruc": settings.COMPANY_RUC
    }

    buffer = BytesIO()
    generator = CatalogPDFGenerator(
        products=product_docs,
        buffer=buffer,
        view_type=filters.view_type,
        company_info=company_info
    )
    generator.build()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    filename = "catalogo_productos.pdf"
    
    return (pdf_bytes, filename)