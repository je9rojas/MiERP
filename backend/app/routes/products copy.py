# /backend/app/routes/products.py

# --- Imports de FastAPI y Python ---
from fastapi import APIRouter, Depends, Body, HTTPException, status
from fastapi.responses import Response
from typing import List, Optional
from pydantic import BaseModel 

# --- Imports de nuestro proyecto ---
# Modelos para la validación de datos
from app.models.product import Product, PanelDimensions, RoundAirDimensions 

# Servicio para la lógica de negocio (generación de PDF)
from app.services import catalog_service

# Dependencia para la autenticación de usuarios
from app.routes.auth import get_current_user

# Creamos el router con su prefijo y etiqueta para la documentación
router = APIRouter(tags=["Products"])

# --- Modelo para los filtros del catálogo ---
# Define qué filtros puede enviar el usuario desde el frontend.
# Esto es más seguro y claro que recibir parámetros sueltos.
class CatalogFilter(BaseModel):
    search_term: Optional[str] = None
    product_types: Optional[List[str]] = None
    # Puedes añadir más filtros aquí:
    # brand: Optional[str] = None
    # min_price: Optional[float] = None

# --- Servicio simulado de búsqueda (a reemplazar con tu lógica de BD) ---
# En un proyecto real, esto estaría en un archivo como `app/services/product_service.py`
async def search_products_in_db(filters: CatalogFilter) -> List[Product]:
    """
    Función simulada que busca productos.
    Aquí es donde harías tu consulta a MongoDB usando Motor.
    `await db_client.db.products.find({...}).to_list(length=100)`
    """
    print(f"Buscando en la base de datos con los filtros: {filters.dict()}")
    
    # Datos de ejemplo para demostración. Reemplázalos con tu llamada a la BD.
    sample_products_data = [
        {
            "_id": "62e1a8b9e4b9f8d1e8a0b1c2",
            "main_code": "FA-101",
            "name": "Filtro de Aire Panel Toyota Hilux",
            "product_type": "aire",
            "dimension_schema": "panel",
            "dimensions": {"A": 220, "B": 210, "H": 45},
            "cross_references": ["CA-9494", "33-2144"],
            "price": 15.50, "stock_quantity": 50, "points": 10,
            "image_url": "https://via.placeholder.com/150/0000FF/FFFFFF?Text=Filtro",
            "dimension_diagram_url": "https://via.placeholder.com/150/EEEEEE/000000?Text=A,B,H"
        },
        {
            "_id": "62e1a8b9e4b9f8d1e8a0b1c3",
            "main_code": "FA-202",
            "name": "Filtro de Aire Redondo Nissan Frontier",
            "product_type": "aire",
            "dimension_schema": "round_air",
            "dimensions": {"A": 150, "B": 80, "C": 150, "D": 80, "H": 120},
            "cross_references": ["CA-5555", "A-1234"],
            "price": 22.00, "stock_quantity": 30, "points": 15,
            "image_url": "https://via.placeholder.com/150/FF0000/FFFFFF?Text=Filtro",
            "dimension_diagram_url": "https://via.placeholder.com/150/EEEEEE/000000?Text=A,B,C,D,H"
        }
        # ... puedes añadir más productos de ejemplo para probar
    ]
    
    # Validamos los datos de la BD contra nuestro modelo Pydantic
    return [Product.parse_obj(p) for p in sample_products_data]

# --- Endpoints de la API ---

@router.get("/", response_model=List[Product])
async def get_all_products(current_user: dict = Depends(get_current_user)):
    """
    Endpoint para obtener una lista de todos los productos.
    (Actualmente devuelve datos de ejemplo)
    """
    # En un caso real, aquí no usarías filtros, solo buscarías todos.
    products = await search_products_in_db(CatalogFilter())
    return products


@router.post("/catalog/generate", response_class=Response)
async def generate_product_catalog(
    filters: CatalogFilter = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Genera un catálogo de productos en formato PDF basado en filtros.

    - **Rol de usuario**: Determina si se incluyen precios y stock.
    - **Filtros**: Se envían en el cuerpo de la petición para búsquedas complejas.
    - **Respuesta**: Devuelve un archivo PDF para descargar.
    """
    try:
        # 1. Determinar la vista basada en el rol del usuario autenticado.
        #    Esto permite mostrar/ocultar información sensible.
        is_seller_view = current_user.get("role") in ["admin", "superadmin", "vendedor"]

        # 2. Obtener los productos de la base de datos usando los filtros.
        #    Delegamos esta lógica a una función/servicio separado.
        products_list = await search_products_in_db(filters)
        
        if not products_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontraron productos con los filtros especificados."
            )

        # 3. Llamar al servicio que crea el PDF.
        #    Toda la complejidad de la generación del PDF está encapsulada allí.
        pdf_bytes = catalog_service.create_catalog_pdf(
            products=products_list, 
            is_seller_view=is_seller_view
        )
        
        # 4. Preparar y devolver la respuesta HTTP con el PDF.
        headers = {
            'Content-Disposition': 'attachment; filename="catalogo_productos.pdf"'
        }
        return Response(content=pdf_bytes, media_type='application/pdf', headers=headers)
        
    except HTTPException:
        # Re-lanza las excepciones HTTP que ya hemos manejado (como el 404)
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