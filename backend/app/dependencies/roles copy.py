# /backend/app/dependencies/roles.py
"""
Módulo de dependencias de FastAPI para la gestión de roles.

Este módulo centraliza la lógica de verificación de permisos basados en roles,
haciendo que los endpoints sean más limpios, seguros y fáciles de mantener.
"""

from fastapi import Depends, HTTPException, status
from app.modules.auth.auth_routes import get_current_active_user
from app.models.user import UserRole

def role_checker(allowed_roles: list[UserRole]):
    """
    Fábrica de dependencias de FastAPI.

    Crea y devuelve una dependencia que verifica si el rol del usuario actual
    está incluido en la lista de roles permitidos (`allowed_roles`).

    Args:
        allowed_roles: Una lista de roles (usando el Enum UserRole) que tienen
                       permiso para acceder al recurso.

    Returns:
        Una función de dependencia asíncrona que puede ser usada en los endpoints.
        Esta dependencia devuelve el objeto del usuario si el rol es válido,
        o lanza una excepción HTTPException 403 (Forbidden) si no lo es.
    """
    async def get_current_user_with_role(
        current_user: dict = Depends(get_current_user)
    ):
        """
        La dependencia real que será inyectada en los endpoints de FastAPI.
        """
        user_role = current_user.get("role")
        
        # Comprueba si el rol del usuario no está en la lista de roles permitidos
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes los permisos necesarios para realizar esta acción."
            )
        
        # Si el rol es válido, devuelve el usuario para que pueda ser usado en el endpoint
        return current_user
    
    # La fábrica devuelve la dependencia recién creada
    return get_current_user_with_role