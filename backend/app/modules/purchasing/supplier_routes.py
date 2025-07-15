# /backend/app/routes/suppliers.py
# CÓDIGO COMPLETO Y CORREGIDO FINAL - LISTO PARA COPIAR Y PEGAR

from fastapi import APIRouter
from typing import List

# Creamos el router con su prefijo. main.py se encargará de añadirlo al /api.
router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

# Endpoint de búsqueda simulado para que el frontend funcione.
@router.get("/")
async def search_suppliers(query: str = ""):
    """
    Busca proveedores por nombre o código.
    En el futuro, esto consultará la base de datos.
    """
    print(f"Buscando proveedores con query: '{query}'")
    
    # Datos de ejemplo para que el autocompletado del frontend funcione.
    mock_suppliers = [
        {"id": "s1", "code": "PROV-001", "name": "Proveedor Principal S.A.C", "tax_id": "20123456789", "legal_address": "Av. Principal 123"},
        {"id": "s2", "code": "PROV-002", "name": "Importaciones Globales EIRL", "tax_id": "20987654321", "legal_address": "Calle Secundaria 456"},
        {"id": "s3", "code": "PROV-003", "name": "Filtros Andinos S.A.", "tax_id": "20333444555", "legal_address": "Jr. Industrial 789"}
    ]

    # Lógica de filtrado simple sobre los datos de ejemplo
    if query:
        query_lower = query.lower()
        results = [
            supplier for supplier in mock_suppliers 
            if query_lower in supplier["name"].lower() or query_lower in supplier["code"].lower()
        ]
        return results
    
    return mock_suppliers