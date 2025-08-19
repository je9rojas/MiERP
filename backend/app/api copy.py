# /backend/app/api.py

"""
Concentrador Principal de Rutas de la API (API Router Hub).

Este archivo actúa como el punto de ensamblaje para todos los routers modulares
de la aplicación. Su única responsabilidad es importar los routers de cada
módulo de negocio y unirlos bajo un único `APIRouter` principal.

Esta centralización mantiene el archivo `main.py` limpio y agnóstico a la
estructura de las rutas, promoviendo una arquitectura modular, organizada y
fácil de escalar.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES DE ROUTERS
# ==============================================================================

from fastapi import APIRouter

# Importamos los routers individuales de cada módulo, usando un alias
# consistente para mayor claridad y prevención de colisiones de nombres.
from app.modules.auth import auth_routes as auth_router
from app.modules.users import user_routes as users_router
from app.modules.roles import role_routes as roles_router
from app.modules.crm import supplier_routes as suppliers_router
# from app.modules.crm import customer_routes as customers_router # Listo para el futuro
from app.modules.inventory import product_routes as products_router
from app.modules.inventory import inventory_routes as inventory_router
from app.modules.purchasing import purchasing_routes as purchasing_router
from app.modules.sales import sales_routes as sales_router
from app.modules.reports import reports_routes as reports_router
from app.modules.data_management import data_management_routes as data_management_router

# ==============================================================================
# SECCIÓN 2: ENSAMBLAJE DEL ROUTER PRINCIPAL
# ==============================================================================

api_router = APIRouter()

# Se registran los routers en un orden lógico que refleja la estructura del negocio.
# El prefijo de cada uno (ej. '/products') se define dentro de su propio archivo de rutas.
# El prefijo global '/api/v1' se aplica en `main.py`.

# --- Sistema y Gestión de Acceso ---
api_router.include_router(auth_router.router)
api_router.include_router(users_router.router)
api_router.include_router(roles_router.router)

# --- CRM (Entidades de Negocio) ---
api_router.include_router(suppliers_router.router)
# api_router.include_router(customers_router.router)

# --- Flujo de Mercancía ---
api_router.include_router(products_router.router)     # Catálogo de Productos
api_router.include_router(inventory_router.router)    # Lotes y Movimientos de Stock
api_router.include_router(purchasing_router.router)   # Entradas (Órdenes de Compra)
api_router.include_router(sales_router.router)        # Salidas (Órdenes de Venta)

# --- Análisis y Administración ---
api_router.include_router(reports_router.router)
api_router.include_router(data_management_router.router)