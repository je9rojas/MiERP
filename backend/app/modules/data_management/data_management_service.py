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
from app.modules.inventory.product_models import ProductCreate, ProductUpdate

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

async def import_products_from_csv(db: AsyncIOMotorDatabase, file: UploadFile) -> Dict:
    """
    Procesa un archivo CSV para crear, actualizar o desactivar productos.
    Es robusto contra errores de formato, codificación y filas vacías.
    Devuelve un resumen detallado de la operación.
    """
    product_repo = ProductRepository(db)
    
    # --- Etapa 1: Lectura y Decodificación Segura del Archivo ---
    contents = await file.read()
    try:
        decoded_content = contents.decode('utf-8')
    except UnicodeDecodeError:
        try:
            decoded_content = contents.decode('latin-1')
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No se pudo decodificar el archivo. Asegúrese de que esté en formato UTF-8 o Latin-1. Error: {e}")

    buffer = io.StringIO(decoded_content)
    try:
        reader = csv.DictReader(buffer)
        rows = list(reader)
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al procesar la estructura del CSV: {e}")

    # --- Etapa 2: Procesamiento de Filas y Gestión de Resultados ---
    summary = {"total_rows": 0, "products_created": 0, "products_updated": 0, "products_deactivated": 0, "rows_with_errors": 0}
    errors = []

    for idx, row in enumerate(rows):
        row_num = idx + 2
        
        # --- Validación Crítica: Ignora filas vacías o sin SKU ---
        # Esto previene errores 'AttributeError' en líneas en blanco al final del archivo.
        sku_value = row.get("sku") if isinstance(row, dict) else None
        if not sku_value or not sku_value.strip():
            continue
        
        summary["total_rows"] += 1
        operation = row.get("operation", "").lower().strip()
        sku = sku_value.strip()

        try:
            # --- Etapa 3: Procesamiento y Validación de una Fila Individual ---
            for json_field in ['specifications', 'oem_codes', 'cross_references', 'applications']:
                if row.get(f"{json_field}_json"):
                    row[json_field] = json.loads(row[f"{json_field}_json"])

            processed_row = {key: value for key, value in row.items() if value is not None and value != ''}
            
            if 'cost' in processed_row: processed_row['cost'] = float(processed_row['cost'])
            if 'price' in processed_row: processed_row['price'] = float(processed_row['price'])
            if 'stock_quantity' in processed_row: processed_row['stock_quantity'] = int(processed_row['stock_quantity'])
            if 'points_on_sale' in processed_row: processed_row['points_on_sale'] = float(processed_row['points_on_sale'])
            if 'weight_kg' in processed_row: processed_row['weight_kg'] = float(processed_row['weight_kg'])

            if operation == "upsert":
                existing_product = await product_repo.find_by_sku(sku)
                
                if existing_product: # Lógica de Actualización (UPDATE)
                    update_model = ProductUpdate(**processed_row)
                    update_data = update_model.model_dump(exclude_unset=True)
                    if update_data:
                        await product_repo.update_one(sku, update_data)
                        summary["products_updated"] += 1
                else: # Lógica de Creación (INSERT)
                    create_model = ProductCreate(**processed_row)
                    product_doc = create_model.model_dump()
                    await product_repo.insert_one(product_doc)
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
            
    # --- Etapa 4: Devolución del Resumen de la Operación ---
    return {"summary": summary, "errors": errors}