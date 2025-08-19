# /backend/app/modules/data_management/data_management_service.py

"""
Capa de Servicio para la Importación y Exportación de Datos Maestros.

Este módulo centraliza la lógica para procesar archivos (ej. CSV) y convertirlos
en operaciones de base de datos. Actúa como un cliente de los servicios de negocio
(como `product_service`), reutilizando su lógica para garantizar la consistencia
y la validación de los datos, en lugar de interactuar directamente con los repositorios.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

# --- Importaciones de la Librería Estándar y Terceros ---
import csv
import io
import json
import logging
from typing import Any, Dict, List

from fastapi import HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

# --- Importaciones de la Aplicación ---
# Se importa el servicio de productos para reutilizar la lógica de negocio.
from app.modules.inventory import product_service
from app.modules.inventory.product_models import ProductCreate, ProductUpdate
from app.modules.inventory.repositories.product_repository import ProductRepository

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: SERVICIOS DE EXPORTACIÓN DE DATOS
# ==============================================================================

async def export_products_to_csv(database: AsyncIOMotorDatabase) -> str:
    """
    Genera un string en formato CSV a partir de todos los productos del catálogo.
    El formato de las columnas está diseñado para ser compatible con la función de importación.
    """
    product_repository = ProductRepository(database)
    all_products: List[Dict[str, Any]] = await product_repository.find_all({})

    output_buffer = io.StringIO()
    
    # Define las columnas del CSV. Los nombres deben coincidir con la lógica de importación.
    fieldnames = [
        'operation', 'sku', 'name', 'brand', 'price', 'category', 'product_type', 'shape',
        'initial_quantity', 'initial_cost', 'description', 'main_image_url',
        'points_on_sale', 'weight_g', 'is_active',
        'dimensions_json', 'oem_codes_json', 'cross_references_json', 'applications_json'
    ]
    writer = csv.DictWriter(output_buffer, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()

    for product in all_products:
        row_data = {
            "operation": "upsert",  # Se sugiere 'upsert' para la re-importación.
            "sku": product.get("sku"),
            "name": product.get("name"),
            "brand": product.get("brand"),
            "price": product.get("price"),
            "category": product.get("category"),
            "product_type": product.get("product_type"),
            "shape": product.get("shape"),
            "initial_quantity": product.get("stock_quantity"), # El stock actual se exporta como stock inicial.
            "initial_cost": product.get("average_cost"),     # El costo actual se exporta como costo inicial.
            "description": product.get("description"),
            "main_image_url": product.get("main_image_url"),
            "points_on_sale": product.get("points_on_sale"),
            "weight_g": product.get("weight_g"),
            "is_active": product.get("is_active"),
            'dimensions_json': json.dumps(product.get('dimensions', {})),
            'oem_codes_json': json.dumps(product.get('oem_codes', [])),
            'cross_references_json': json.dumps(product.get('cross_references', [])),
            'applications_json': json.dumps(product.get('applications', [])),
        }
        writer.writerow(row_data)

    return output_buffer.getvalue()

# ==============================================================================
# SECCIÓN 4: SERVICIOS DE IMPORTACIÓN DE DATOS
# ==============================================================================

async def import_products_from_csv(database: AsyncIOMotorDatabase, file: UploadFile) -> Dict[str, Any]:
    """
    Procesa un archivo CSV para crear, actualizar o desactivar productos masivamente.
    Delega las operaciones de negocio a `product_service` para asegurar consistencia.
    """
    # Etapa 1: Lectura y Decodificación Segura del Archivo
    contents = await file.read()
    try:
        decoded_content = contents.decode('utf-8')
    except UnicodeDecodeError:
        decoded_content = contents.decode('latin-1', errors='replace')

    buffer = io.StringIO(decoded_content)
    reader = csv.DictReader(buffer)

    # Etapa 2: Procesamiento de Filas
    summary = {"total_rows": 0, "products_created": 0, "products_updated": 0, "products_deactivated": 0, "rows_with_errors": 0}
    errors: List[str] = []

    for idx, row in enumerate(reader):
        row_num = idx + 2
        
        # Ignorar filas vacías o sin SKU
        sku = row.get("sku", "").strip()
        if not sku:
            continue
        
        summary["total_rows"] += 1
        operation = row.get("operation", "").lower().strip()

        try:
            # Etapa 3: Preparar datos para los modelos Pydantic
            catalog_data = {k: v for k, v in row.items() if v not in [None, '']}
            inventory_data = {
                'initial_quantity': int(row.get('initial_quantity') or 0),
                'initial_cost': float(row.get('initial_cost') or 0.0)
            }
            
            # Cargar y parsear campos JSON
            for json_field in ['dimensions', 'oem_codes', 'cross_references', 'applications']:
                json_value = row.get(f"{json_field}_json")
                if json_value:
                    catalog_data[json_field] = json.loads(json_value)

            # Etapa 4: Ejecución de la Operación delegando al servicio
            if operation == "upsert":
                # --- CORRECCIÓN CRÍTICA ---
                # Se utiliza un bloque try/except para verificar la existencia del producto.
                existing_product = None
                try:
                    existing_product = await product_service.get_product_by_sku(database, sku)
                except HTTPException as e:
                    if e.status_code != status.HTTP_404_NOT_FOUND:
                        raise  # Vuelve a lanzar cualquier excepción que no sea 'No Encontrado'
                
                if existing_product:
                    # --- Operación de Actualización ---
                    update_model = ProductUpdate.model_validate(catalog_data)
                    await product_service.update_product_by_sku(database, sku, update_model)
                    summary["products_updated"] += 1
                else:
                    # --- Operación de Creación ---
                    create_model = ProductCreate.model_validate(catalog_data)
                    await product_service.create_product(
                        database,
                        create_model,
                        inventory_data['initial_quantity'],
                        inventory_data['initial_cost']
                    )
                    summary["products_created"] += 1

            elif operation == "delete":
                await product_service.deactivate_product_by_sku(database, sku)
                summary["products_deactivated"] += 1
            
            elif operation: # Si la operación no es vacía pero tampoco es válida
                raise ValueError(f"Operación '{operation}' no reconocida. Use 'upsert' o 'delete'.")

        except ValidationError as e:
            error_details = e.errors()
            error_msg = ", ".join([f"{err['loc'][0]}: {err['msg']}" for err in error_details])
            errors.append(f"Fila {row_num} (SKU: {sku}): Error de validación - {error_msg}")
            summary["rows_with_errors"] += 1
        except Exception as e:
            errors.append(f"Fila {row_num} (SKU: {sku}): Error inesperado - {str(e)}")
            summary["rows_with_errors"] += 1
            logger.error(f"Error procesando fila {row_num} del CSV (SKU: {sku}): {e}", exc_info=True)
            
    return {"summary": summary, "errors": errors}