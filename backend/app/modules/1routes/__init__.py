# /backend/app/routes/__init__.py
# CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

from ..auth import auth_routes
from ..inventory import product_routes
from ..users import users
from ..roles import roles
from ..purchasing import supplier_routes       # <-- LÍNEA AÑADIDA
from ..purchasing import purchase_order_routes # <-- LÍNEA AÑADIDA