# /backend/app/modules/crm/customer_routes.py
# GESTOR DE RUTAS PARA LA ENTIDAD CLIENTE

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# --- SECCIÓN 1: IMPORTACIONES ---

# Dependencias del núcleo y de otros módulos
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut

# Importaciones relativas dentro del mismo módulo 'crm'
from . import crm_service # Suponiendo que la lógica estará en crm_service.py
from .customer_models import CustomerCreate, CustomerOut, CustomerUpdate

# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER ---

router = APIRouter(prefix="/customers", tags=["CRM - Customers"])

# Definimos los roles que tendrán acceso a la gestión de clientes
ROLES_ALLOWED_TO_MANAGE_CUSTOMERS = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES, # El rol de ventas es el principal para gestionar clientes
]

# --- SECCIÓN 3: MODELO DE RESPUESTA PAGINADA ---

class PaginatedCustomerResponse(BaseModel):
    """Define la estructura de la respuesta para las peticiones paginadas de clientes."""
    total: int
    items: List[CustomerOut]

# --- SECCIÓN 4: ENDPOINTS DEL CRUD DE CLIENTES ---

@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_new_customer(
    customer_data: CustomerCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_CUSTOMERS))
):
    """
    Crea un nuevo cliente en el sistema.
    """
    try:
        # Aquí llamarías a la función del servicio que aún no hemos creado
        # created_customer = await crm_service.create_customer(db, customer_data)
        # return created_customer
        
        # --- Marcador de posición temporal ---
        print(f"Recibidos datos para crear cliente: {customer_data.model_dump_json(indent=2)}")
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="La creación de clientes aún no está implementada.")
        # --- Fin del marcador de posición ---

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al crear el cliente.")


@router.get("/", response_model=PaginatedCustomerResponse)
async def get_all_customers(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_CUSTOMERS)),
    search: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10,
):
    """
    Obtiene una lista paginada de clientes.
    """
    # --- Marcador de posición temporal ---
    print("Petición para listar clientes recibida.")
    return {"total": 0, "items": []}
    # --- Fin del marcador de posición ---
    
    # En el futuro, aquí llamarías al servicio:
    # result = await crm_service.get_customers_with_filters(db=db, search=search, page=page, page_size=pageSize)
    # return result


# Aquí irían los otros endpoints del CRUD (GET por ID, PUT, DELETE)
# que seguirían el mismo patrón de marcador de posición por ahora.