# /backend/app/api.py

"""
Ensamblador Principal de la API.

Este archivo importa todos los routers de los diferentes módulos de la aplicación
y los incluye en un único APIRouter principal. Esto mantiene el archivo `main.py`
limpio y desacoplado de la estructura específica de las rutas de la API,
facilitando la organización y escalabilidad del proyecto.
"""

from fastapi import APIRouter

# Importamos los routers de cada módulo de negocio
from app.modules.auth import auth_routes
from app.modules.crm import supplier_routes, customer_routes
from app.modules.data_management import data_management_routes
from app.modules.inventory import product_routes
from app.modules.purchasing import purchasing_routes
from app.modules.roles import role_routes
from app.modules.users import user_routes

# Creamos el router principal que agrupará todas las rutas de la API.
api_router = APIRouter()

# Incluimos cada router modular en el router principal.
# Cada uno ya tiene su propio prefijo (ej. '/products', '/suppliers'), por lo que
# las URLs finales serán compuestas, por ejemplo: /api/v1/products
api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(role_routes.router)
api_router.include_router(product_routes.router)
api_router.include_router(supplier_routes.router)
api_router.include_router(customer_routes.router)
api_router.include_router(purchasing_routes.router)
api_router.include_router(data_management_routes.router)