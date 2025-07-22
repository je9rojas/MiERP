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
# Se importan los repositorios y modelos de otros módulos para interactuar con sus datos.
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.inventory.product_models import ProductCreate, ProductUpdate, ProductInDB

# --- SECCIÓN DE SERVICIOS DE EXPORTACIÓN ---

async def export_products_to_csv(db: AsyncIOMotorDatabase) -> str:
    """
    Obtiene todos los datos de los productos y los formatea en un string CSV.
    Los campos complejos (listas y diccionarios) se serializan a formato JSON
    para crear un backup completo que puede ser utilizado como plantilla para la re-importación.
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
        product['specifications_json'] = json.dumps(product.get('specifications', {}))
        product['oem_codes_json'] = json.dumps(product.get('oem_codes', []))
        product['cross_references_json'] = json.dumps(product.get('cross_references', []))
        product['applications_json'] = json.dumps(product.get('applications', []))
        
        clean_product = {key: str(value) if value is not None else "" for key, value in product.items()}
        clean_product['operation'] = ''
        
        writer.writerow(clean_product)

    return output.getvalue()

# --- SECCIÓN DE SERVICIOS DE IMPORTACIÓN ---

async def import_products_from_csv(db: AsyncIOMotorDatabase, file: UploadFile) -> dict:
    """
    Procesa un archivo CSV para gestionar productos, con una lógica de procesamiento
    de filas inmutable para garantizar que todas las filas se procesen correctamente.
    """
    product_repo = ProductRepository(db)
    
    # Etapa 1: Lectura y Decodificación Segura del Archivo
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

    # Etapa 2: Procesamiento de Filas y Gestión de Resultados
    summary = {"total_rows": 0, "products_created": 0, "products_updated": 0, "products_deactivated": 0, "rows_with_errors": 0}
    errors = []

    for idx, original_row in enumerate(rows):
        # Ignora filas vacías o sin SKU
        if not original_row:
            continue
        
        row_num = idx + 2
        sku_value = original_row.get("sku") if isinstance(original_row, dict) else None
        if not sku_value or not sku_value.strip():
            continue
        
        summary["total_rows"] += 1
        sku = sku_value.strip()
        operation = original_row.get("operation", "").lower().strip()

        try:
            # Etapa 3: Procesamiento Inmutable de una Fila Individual
            data_for_validation = {
                key: value for key, value in original_row.items()
                if value is not None and value != '' and not key.endswith('_json')
            }

            for json_field in ['specifications', 'oem_codes', 'cross_references', 'applications']:
                json_value = original_row.get(f"{json_field}_json")
                if json_value:
                    data_for_validation[json_field] = json.loads(json_value)

            if 'cost' in data_for_validation: data_for_validation['cost'] = float(data_for_validation['cost'])
            if 'price' in data_for_validation: data_for_validation['price'] = float(data_for_validation['price'])
            if 'stock_quantity' in data_for_validation: data_for_validation['stock_quantity'] = int(data_for_validation['stock_quantity'])
            if 'points_on_sale' in data_for_validation: data_for_validation['points_on_sale'] = float(data_for_validation['points_on_sale'])
            if 'weight_kg' in data_for_validation: data_for_validation['weight_kg'] = float(data_for_validation['weight_kg'])
            
            # Etapa 4: Ejecución de la Operación
            if operation == "upsert":
                existing_product = await product_repo.find_by_sku(sku)
                
                if existing_product: # UPDATE
                    update_model = ProductUpdate(**data_for_validation)
                    update_data = update_model.model_dump(exclude_unset=True)
                    if update_data:
                        await product_repo.update_one(sku, update_data)
                        summary["products_updated"] += 1
                else: # INSERT
                    create_model = ProductCreate(**data_for_validation)
                    new_product_in_db = ProductInDB(**create_model.model_dump())
                    product_doc_to_insert = new_product_in_db.model_dump(by_alias=True)
                    await product_repo.insert_one(product_doc_to_insert)
                    summary["products_created"] += 1
            
            elif operation == "delete":
                matched_count = await product_repo.deactivate_one(sku, {"is_active": False})
                if matched_count > 0:
                    summary["products_deactivated"] += 1
            
            elif operation:
                errors.append(f"Fila {row_num}: Operación '{operation}' no válida. Use 'upsert' o 'delete'.")
                summary["rows_with_errors"] += 1

        except ValidationError as e:
            error_details = ', '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
            errors.append(f"Fila {row_num} (SKU: {sku}): Error de validación - {error_details}")
            summary["rows_with_errors"] += 1
        except json.JSONDecodeError:
            errors.append(f"Fila {row_num} (SKU: {sku}): Formato JSON inválido en una de las columnas.")
            summary["rows_with_errors"] += 1
        except Exception as e:
            errors.append(f"Fila {row_num} (SKU: {sku}): Error inesperado - {str(e)}")
            summary["rows_with_errors"] += 1
            
    # Etapa 5: Devolución del Resumen de la Operación
    return {"summary": summary, "errors": errors}