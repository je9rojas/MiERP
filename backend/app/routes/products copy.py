# /backend/app/routes/products.py
# CÓDIGO CORREGIDO CON SUPERADMIN INCLUIDO EN LOS PERMISOS

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.services import product_service
from app.models.product import ProductCreate, ProductOut
from app.dependencies.roles import role_checker
from app.models.user import UserRole

router = APIRouter(prefix="/products", tags=["Products"])

# Definimos los roles permitidos en una lista clara
ROLES_ALLOWED_TO_CREATE_PRODUCTS = [
    UserRole.SUPERADMIN,  # <-- ¡ROL AÑADIDO!
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.WAREHOUSE,
]

# Endpoint para crear un nuevo producto
@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    product: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # Usamos la lista de roles definida arriba
    _user: dict = Depends(role_checker(ROLES_ALLOWED_TO_CREATE_PRODUCTS))
):
    """
    Crea un nuevo producto en el inventario.
    Roles permitidos: superadmin, admin, manager, warehouse.
    """
    print("--- [PRODUCTS] Petición para crear nuevo producto recibida ---")
    print(product.model_dump_json(indent=2))
    print("---------------------------------------------------------")

    try:
        created_product = await product_service.create_product(db, product)
        print(f"✅ Producto '{created_product.sku}' creado exitosamente en la base de datos.")
        return created_product
        
    except ValueError as ve:
        print(f"❌ Error de validación: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        
    except Exception as e:
        print(f"❌ ERROR INESPERADO al crear producto: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno inesperado al procesar su solicitud."
        )

# Endpoint para obtener todos los productos
@router.get("/", response_model=List[ProductOut])
async def get_all_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles()))
):
    """Obtiene una lista de todos los productos activos."""
    products = await product_service.get_all_products(db)
    return products

# Endpoint para obtener un producto específico por su SKU
@router.get("/{sku}", response_model=ProductOut)
async def get_product_by_sku_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles())) # Cualquier usuario logueado puede ver un producto
):
    """
    Obtiene los detalles de un producto específico por su SKU.
    """
    print(f"--- [PRODUCTS] Solicitud para obtener producto con SKU: {sku} ---")
    product = await product_service.get_product_by_sku(db, sku)
    if not product:
        print(f"❌ Producto con SKU '{sku}' no encontrado.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado."
        )
    print(f"✅ Producto '{sku}' encontrado y devuelto.")
    return product


# /backend/app/routes/products.py

# ... (después del endpoint get_product_by_sku_route)

# Endpoint para actualizar un producto
@router.put("/{sku}", response_model=ProductOut)
async def update_product_route(
    sku: str,
    product_data: ProductUpdate, # Usamos el modelo ProductUpdate que permite campos opcionales
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE])) # Roles que pueden editar
):
    """
    Actualiza la información de un producto existente.
    """
    print(f"--- [PRODUCTS] Petición para actualizar producto con SKU: {sku} ---")
    print(product_data.model_dump_json(indent=2))
    
    updated_product = await product_service.update_product_by_sku(db, sku, product_data)
    
    if not updated_product:
        print(f"❌ Intento de actualizar un producto no existente con SKU '{sku}'.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado para actualizar."
        )
        
    print(f"✅ Producto '{sku}' actualizado exitosamente.")
    return updated_product



# --- NUEVO ENDPOINT ---
@router.delete("/{sku}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_product_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER])) # Solo admin y manager pueden desactivar
):
    """
    Desactiva un producto en el sistema (soft delete).
    """
    print(f"--- [PRODUCTS] Petición para DESACTIVAR producto con SKU: {sku} ---")
    
    success = await product_service.deactivate_product_by_sku(db, sku)
    
    if not success:
        print(f"❌ Intento de desactivar un producto no existente o ya inactivo con SKU '{sku}'.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado o sin cambios que aplicar."
        )
        
    print(f"✅ Producto '{sku}' desactivado exitosamente.")
    return None # Con status 204, no se devuelve contenido







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