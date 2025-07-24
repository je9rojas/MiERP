# /backend/app/dependencies/roles.py
# REFACTORIZADO A UN VERIFICADOR DE PERMISOS (PERMISSION CHECKER)

"""
Este módulo define la dependencia de FastAPI para el control de acceso basado en PERMISOS.
Proporciona una función `permission_checker` que protege los endpoints,
asegurando que solo los usuarios con los permisos necesarios puedan acceder.
"""

from typing import List
from fastapi import Depends, HTTPException, status

# --- Importaciones de Modelos y Dependencias de Autenticación ---
from app.modules.users.user_models import UserRole, UserOut
# Asumimos que `get_current_active_user` ahora devuelve un UserOut con la lista de permisos
from app.modules.auth.auth_routes import get_current_active_user

def permission_checker(required_permissions: List[str]):
    """
    Factoría de dependencias que crea un verificador de PERMISOS.

    Esta función genera una dependencia que:
    1. Obtiene el usuario activo (que ya incluye su lista de permisos desde el token JWT).
    2. Otorga acceso inmediato y universal si el rol del usuario es SUPERADMIN.
    3. Verifica que el usuario tenga TODOS los permisos en la lista `required_permissions`.
    4. Lanza HTTPException 403 (Forbidden) si la verificación falla.

    Args:
        required_permissions: Una lista de strings de permisos requeridos.

    Returns:
        Una función de dependencia de FastAPI (`check_permissions`).
    """
    
    def check_permissions(current_user: UserOut = Depends(get_current_active_user)) -> UserOut:
        """
        La dependencia real que realiza la verificación de permisos.
        """
        
        # Regla 1: Acceso universal e implícito para el SUPERADMIN.
        # Esta regla tiene prioridad sobre todas las demás.
        if current_user.role == UserRole.SUPERADMIN:
            print(f"✅ Acceso Permitido (SUPERADMIN): El usuario '{current_user.username}' tiene acceso universal.")
            return current_user

        # Regla 2: Verificación explícita de permisos para todos los demás roles.
        user_permissions = set(current_user.permissions)
        
        for permission in required_permissions:
            if permission not in user_permissions:
                print(f"❌ Acceso Denegado: El usuario '{current_user.username}' no tiene el permiso requerido: '{permission}'")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tiene el permiso '{permission}' para realizar esta acción."
                )
        
        # Si se superan todas las verificaciones, el acceso es concedido.
        print(f"✅ Acceso Permitido: El usuario '{current_user.username}' tiene los permisos: {required_permissions}.")
        return current_user

    # La factoría devuelve la función de dependencia interna.
    return check_permissions