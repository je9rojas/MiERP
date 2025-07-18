# /backend/app/modules/data_management/data_management_routes.py

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from . import data_management_service
from fastapi import APIRouter, Depends, UploadFile, File


router = APIRouter(prefix="/data", tags=["Data Management"])

@router.get("/export/products", summary="Exportar todos los productos a CSV")
async def export_products(db: AsyncIOMotorDatabase = Depends(get_db)):
    csv_data = await data_management_service.export_products_to_csv(db)
    
    response = StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=export_productos.csv"}
    )
    return response


@router.post("/import/products", summary="Importar productos desde un archivo CSV")
async def import_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.csv'):
        return {"error": "El archivo debe ser de tipo CSV."}
    
    result = await data_management_service.import_products_from_csv(db, file)
    return result