# /backend/app/modules/data_management/data_management_service.py
# SERVICIO DEDICADO A LA IMPORTACIÓN Y EXPORTACIÓN DE DATOS MAESTROS

import csv
import io
import json
from typing import List, Dict
from fastapi import UploadFile, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

# --- SECCIÓN DE IMPORTACIONES DE MÓDULOS ---
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.inventory.product_models import ProductCreate, ProductUpdate, ProductInDB

# --- SECCIÓN DE SERVICIOS DE EXPORTACIÓN ---

async def export_products_to_csv(db: AsyncIOMotorDatabase) -> str:
    """
    Obtiene todos los datos de los productos y los formatea en un string CSV.
    Este archivo está diseñado para ser una plantilla perfecta para la re-importación.
    """
    product_repo = ProductRepository(db)
    all_products: List[Dict] = await product_repo.find_all({})

    output = io.StringIO()
    
    fieldnames = [
        'operation', 'sku', 'name', 'brand', 'main_image_url', 'description', 
        'category', 'product_type', 'shape', 'cost', 'price', 'stock_quantity',
        'points_on_sale', 'weight_kg', 'is_active',
        'specifications_json', 'oem_codes_json', 'cross_references_json', 'applications_json'
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()

    if not all_products:
        return output.getvalue()

    for product in all_products:
        row_data = {
            "operation": "",
            "sku": product.get("sku"),
            "name": product.get("name"),
            "brand": product.get("brand"),
            "main_image_url": product.get("main_image_url"),
            "description": product.get("description"),
            "category": product.get("category"),
            "product_type": product.get("product_type"),
            "shape": product.get("shape"),
            "cost": product.get("cost"),
            "price": product.get("price"),
            "stock_quantity": product.get("stock_quantity"),
            "points_on_sale": product.get("points_on_sale"),
            "weight_kg": product.get("weight_kg"),
            "is_active": product.get("is_active"),
            'specifications_json': json.dumps(product.get('specifications', {})),
            'oem_codes_json': json.dumps(product.get('oem_codes', [])),
            'cross_references_json': json.dumps(product.get('cross_references', [])),
            'applications_json': json.dumps(product.get('applications', [])),
        }
        writer.writerow(row_data)

    return output.getvalue()

# --- SECCIÓN DE SERVICIOS DE IMPORTACIÓN ---

async def import_products_from_csv(db: AsyncIOMotorDatabase, file: UploadFile) -> Dict:
    """
    Procesa un archivo CSV para gestionar productos, con una lógica robusta de limpieza
    y conversión de tipos de datos.
    """
    product_repo = ProductRepository(db)
    
    # Etapa 1: Lectura y Decodificación Segura
    contents = await file.read()
    try:
        decoded_content = contents.decode('utf-8')
    except UnicodeDecodeError:
        try:
            decoded_content = contents.decode('latin-1')
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No se pudo decodificar el archivo: {e}")

    buffer = io.StringIO(decoded_content)
    try:
        reader = csv.DictReader(buffer)
        rows = list(reader)
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al procesar la estructura del CSV: {e}")

    # Etapa 2: Procesamiento de Filas
    summary = {"total_rows": 0, "products_created": 0, "products_updated": 0, "products_deactivated": 0, "rows_with_errors": 0}
    errors = []

    for idx, original_row in enumerate(rows):
        if not original_row: continue
        row_num = idx + 2
        sku_value = original_row.get("sku") if isinstance(original_row, dict) else None
        if not sku_value or not sku_value.strip(): continue
        summary["total_rows"] += 1
        sku = sku_value.strip()
        operation = original_row.get("operation", "").lower().strip()

        try:
            # Etapa 3: Preparación y Limpieza de Datos de la Fila
            data_to_process = {
                key: value for key, value in original_row.items()
                if value is not None and value != '' and not key.endswith('_json')
            }

            for json_field in ['specifications', 'oem_codes', 'cross_references', 'applications']:
                json_value = original_row.get(f"{json_field}_json")
                if json_value:
                    data_to_process[json_field] = json.loads(json_value)

            # Limpieza de tipos de datos dentro de specifications
            if 'specifications' in data_to_process and isinstance(data_to_process['specifications'], dict):
                specs = data_to_process['specifications']
                cleaned_specs = {}
                for key, value in specs.items():
                    try:
                        cleaned_specs[key] = float(value)
                    except (ValueError, TypeError):
                        cleaned_specs[key] = str(value)
                data_to_process['specifications'] = cleaned_specs

            if 'cost' in data_to_process: data_to_process['cost'] = float(data_to_process['cost'])
            if 'price' in data_to_process: data_to_process['price'] = float(data_to_process['price'])
            if 'stock_quantity' in data_to_process: data_to_process['stock_quantity'] = int(data_to_process['stock_quantity'])
            if 'points_on_sale' in data_to_process: data_to_process['points_on_sale'] = float(data_to_process['points_on_sale'])
            if 'weight_kg' in data_to_process: data_to_process['weight_kg'] = float(data_to_process['weight_kg'])
            
            # Etapa 4: Ejecución de la Operación
            if operation == "upsert":
                existing_product = await product_repo.find_by_sku(sku)
                if existing_product:
                    update_model = ProductUpdate(**data_to_process)
                    update_data = update_model.model_dump(exclude_unset=True)
                    if update_data:
                        matched_count = await product_repo.update_one(sku, update_data)
                        if matched_count > 0: summary["products_updated"] += 1
                else:
                    create_model = ProductCreate(**data_to_process)
                    new_product_in_db = ProductInDB(**create_model.model_dump())
                    product_doc_to_insert = new_product_in_db.model_dump(by_alias=True)
                    await product_repo.insert_one(product_doc_to_insert)
                    summary["products_created"] += 1
            elif operation == "delete":
                matched_count = await product_repo.deactivate_one(sku, {"is_active": False})
                if matched_count > 0: summary["products_deactivated"] += 1
            elif operation:
                errors.append(f"Fila {row_num}: Operación '{operation}' no válida.")
                summary["rows_with_errors"] += 1

        except Exception as e:
            summary["rows_with_errors"] += 1
            errors.append(f"Fila {row_num} (SKU: {sku}): Error inesperado - {str(e)}")
            
    return {"summary": summary, "errors": errors}