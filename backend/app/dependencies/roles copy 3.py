# /backend/app/dependencies/roles.py

"""
Este módulo define la dependencia de FastAPI para el control de acceso basado en ROLES (RBAC).
Proporciona una función `role_checker` que se utiliza para proteger los endpoints de la API,
asegurando que solo los usuarios con los roles adecuados puedan acceder a recursos específicos.
"""

from typing import List
from fastapi import Depends, HTTPException, status

# --- Importaciones de Modelos y Dependencias de Autenticación ---
from app.modules.users.user_models import UserRole, UserOut
from app.modules.auth.dependencies import get_current_active_user


def role_checker(allowed_roles: List[UserRole]):
    """
    Factoría de dependencias que crea un verificador de ROLES personalizado.

    Esta función genera una dependencia de FastAPI que:
    1. Obtiene el usuario activo actual a través del token JWT.
    2. Otorga acceso inmediato y universal si el rol del usuario es SUPERADMIN.
    3. Verifica si el rol del usuario está en la lista de 'allowed_roles' para todos los demás casos.
    4. Lanza una excepción HTTPException 403 (Forbidden) si la verificación falla.

    Args:
        allowed_roles: Una lista de `UserRole` (Enum) que tienen permiso para acceder al endpoint.

    Returns:
        Una función de dependencia de FastAPI (`check_roles`) que puede ser usada en los endpoints.
    """
    
    def check_roles(current_user: UserOut = Depends(get_current_active_user)) -> UserOut:
        """
        La dependencia real que realiza la verificación del rol.
        Es inyectada por FastAPI en los endpoints protegidos.

        Args:
            current_user: El modelo del usuario autenticado, inyectado por `get_current_active_user`.

        Raises:
            HTTPException: Si el rol del usuario no está permitido.

        Returns:
            El objeto `UserOut` del usuario si tiene permiso, permitiendo que el endpoint continúe.
        """
        
        # --- LÓGICA DE VERIFICACIÓN DE PERMISOS ---
        
        # Regla 1: Acceso universal e implícito para el SUPERADMIN.
        # Esta es la primera y más importante verificación.
        if current_user.role == UserRole.SUPERADMIN:
            print(f"✅ Acceso Permitido (SUPERADMIN): El usuario '{current_user.username}' tiene acceso universal.")
            return current_user

        # Regla 2: Verificación estándar para todos los demás roles.
        # Comprueba si el rol del usuario está en la lista de roles permitidos.
        if current_user.role not in allowed_roles:
            print(f"❌ Acceso Denegado: El rol '{current_user.role.value}' del usuario '{current_user.username}' no está en la lista de roles permitidos: {[role.value for role in allowed_roles]}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene los permisos necesarios para realizar esta acción."
            )
        
        # Si se superan todas las verificaciones, el acceso es concedido.
        print(f"✅ Acceso Permitido: El rol '{current_user.role.value}' del usuario '{current_user.username}' es válido.")
        return current_user

    # La factoría devuelve la función de dependencia interna.
    return check_roles