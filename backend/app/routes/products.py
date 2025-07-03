# /backend/app/routes/products.py
# CÓDIGO COMPLETO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

# --- Imports de FastAPI y Python ---
from fastapi import APIRouter, Depends, Body, HTTPException, status
from fastapi.responses import Response
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum  # <-- Importar Enum

# --- Imports de nuestro proyecto ---
from app.models.product import Product
from app.services import catalog_service
from app.dependencies.roles import role_checker
from app.models.user import UserRole

# Creamos el router con su prefijo y etiqueta para la documentación
#router = APIRouter(prefix="/products", tags=["Products"]) <-- Añadido prefix para buena práctica

router = APIRouter() 

# --- Modelo para la petición de catálogo (ACTUALIZADO) ---
class ViewType(str, Enum):
    SELLER = "seller"
    CLIENT = "client"

class CatalogRequest(BaseModel):
    search_term: Optional[str] = None
    product_types: Optional[List[str]] = None
    view_type: ViewType = Field(..., description="El tipo de vista para el reporte: 'seller' o 'client'")

# --- Servicio simulado de búsqueda (sin cambios) ---
async def search_products_in_db(filters: CatalogRequest) -> List[Product]:
    """
    Función simulada que busca productos.
    Aquí es donde harías tu consulta a MongoDB usando Motor.
    """
    print(f"Buscando en la base de datos con los filtros: {filters.dict()}")
    sample_products_data = [
        {
            "_id": "62e1a8b9e4b9f8d1e8a0b1c2", "main_code": "FA-101", "name": "Filtro de Aire Panel Toyota Hilux", "product_type": "aire",
            "dimension_schema": "panel", "dimensions": {"A": 220, "B": 210, "H": 45}, "cross_references": ["CA-9494", "33-2144"],
            "price": 15.50, "stock_quantity": 50, "points": 10,
            "image_url": "https://via.placeholder.com/150/0000FF/FFFFFF?Text=Filtro", "dimension_diagram_url": "https://via.placeholder.com/150/EEEEEE/000000?Text=A,B,H"
        },
        {
            "_id": "62e1a8b9e4b9f8d1e8a0b1c3", "main_code": "FA-202", "name": "Filtro de Aire Redondo Nissan Frontier", "product_type": "aire",
            "dimension_schema": "round_air", "dimensions": {"A": 150, "B": 80, "C": 150, "D": 80, "H": 120},
            "cross_references": ["CA-5555", "A-1234"],
            "price": 22.00, "stock_quantity": 30, "points": 15,
            "image_url": "https://via.placeholder.com/150/FF0000/FFFFFF?Text=Filtro", "dimension_diagram_url": "https://via.placeholder.com/150/EEEEEE/000000?Text=A,B,C,D,H"
        }
    ]
    return [Product.parse_obj(p) for p in sample_products_data]

# --- Endpoints de la API ---

@router.get("/", response_model=List[Product])
async def get_all_products(
    current_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.WAREHOUSE]))
):
    """Obtiene una lista de todos los productos."""
    # En un futuro, podrías pasar filtros aquí como query params.
    products = await search_products_in_db(CatalogRequest(view_type=ViewType.CLIENT)) # Pasamos un default
    return products


@router.post("/catalog/generate", response_class=Response)
async def generate_product_catalog(
    request_data: CatalogRequest = Body(...),
    # Aseguramos que solo roles autorizados puedan siquiera intentar generar un reporte.
    current_user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]))
):
    """
    Genera un catálogo de productos en PDF.
    - El usuario elige explícitamente el tipo de vista (vendedor o cliente).
    - El backend valida si el rol del usuario le permite generar la vista de vendedor.
    """
    try:
        # 1. Lógica de seguridad para la vista de vendedor
        is_seller_view_requested = request_data.view_type == ViewType.SELLER
        
        # Lista de roles que tienen permiso para ver la información sensible
        roles_allowed_for_seller_view = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]

        # Si el usuario pide la vista de vendedor, verificamos que tenga el rol adecuado
        if is_seller_view_requested and current_user.get("role") not in roles_allowed_for_seller_view:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para generar un catálogo con vista de vendedor (precios, stock y puntos)."
            )

        # 2. Obtener los productos de la base de datos
        products_list = await search_products_in_db(request_data)
        
        if not products_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontraron productos con los filtros especificados."
            )

        # 3. Llamar al servicio que crea el PDF
        pdf_bytes = catalog_service.create_catalog_pdf(
            products=products_list, 
            is_seller_view=is_seller_view_requested
        )
        
        # 4. Preparar y devolver la respuesta con un nombre de archivo dinámico
        filename = "catalogo_vendedor.pdf" if is_seller_view_requested else "catalogo_cliente.pdf"
        headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
        return Response(content=pdf_bytes, media_type='application/pdf', headers=headers)
        
    except HTTPException:
        # Re-lanza las excepciones HTTP que ya hemos manejado
        raise
    except Exception as e:
        # Captura cualquier otro error inesperado y devuelve un 500
        print(f"Error inesperado al generar el catálogo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al generar el catálogo."
        )

# Tu endpoint original, ahora integrado. Puedes borrarlo si el nuevo `GET /` lo reemplaza.
@router.get("/old")
async def get_products_legacy():
    return {"message": "This is the old products endpoint"}