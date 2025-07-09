# /backend/app/routes/products.py
# CÓDIGO CORREGIDO Y CONSISTENTE CON ROLES EN INGLÉS

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.services import product_service
from app.models.product import ProductCreate, ProductOut
from app.dependencies.roles import role_checker
from app.models.user import UserRole

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    product: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # Ahora usamos los nombres en inglés del Enum
    _user: dict = Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]))
):
    """
    Creates a new product in the inventory.
    Allowed roles: admin, manager, warehouse.
    """
    try:
        created_product = await product_service.create_product(db, product)
        return created_product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred while creating the product.")

@router.get("/", response_model=List[ProductOut])
async def get_all_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles()))
):
    """Retrieves a list of all active products."""
    products = await product_service.get_all_products(db)
    return products


# --- PUEDES MANTENER TU RUTA DE CATÁLOGO AQUÍ, PERO NECESITARÁ AJUSTES ---
# La lógica de 'search_products_in_db' debería moverse a 'product_service.py'
# y el modelo 'CatalogRequest' debería estar en un archivo de schemas.
# Por ahora, la dejo comentada para enfocarnos en la creación de productos.
"""
class ViewType(str, Enum):
    SELLER = "seller"
    CLIENT = "client"

class CatalogRequest(BaseModel):
    search_term: Optional[str] = None
    product_types: Optional[List[str]] = None
    view_type: ViewType = Field(..., description="El tipo de vista para el reporte")

@router.post("/catalog/generate", ...)
async def generate_product_catalog(...):
    # ...
"""