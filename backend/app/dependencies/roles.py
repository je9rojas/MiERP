# /backend/app/dependencies/roles.py

"""
Módulo de Dependencias para la Gestión de Roles y Permisos (RBAC).

Este archivo define un sistema de dependencias reutilizable para FastAPI que permite
proteger endpoints específicos, asegurando que solo los usuarios con los roles
adecuados puedan acceder a ellos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

# --- Importaciones de la Librería Estándar y Terceros ---
import logging
from typing import List, Callable

from fastapi import Depends, HTTPException, status

# --- Importaciones de la Aplicación ---
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.user_models import UserOut, UserRole

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN INICIAL
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: DEPENDENCIA DE VERIFICACIÓN DE ROLES
# ==============================================================================

def role_checker(allowed_roles: List[UserRole]) -> Callable[[UserOut], UserOut]:
    """
    Factoría de dependencias para la verificación de roles de usuario.

    Esta función no es una dependencia en sí misma, sino que genera y retorna
    una dependencia dinámica (`check_roles`) que puede ser utilizada por FastAPI.
    Este patrón permite pasar argumentos (la lista de roles permitidos) a la
    dependencia de una manera limpia y reutilizable.

    Args:
        allowed_roles: Una lista de enumeraciones `UserRole` que tienen permiso
                       para acceder al endpoint.

    Returns:
        Una función de dependencia (`check_roles`) que FastAPI puede ejecutar.
        Esta función, a su vez, retornará el objeto `UserOut` si la validación
        es exitosa.
    """
    
    # Esta es la dependencia real que FastAPI ejecutará.
    def check_roles(current_user: UserOut = Depends(get_current_active_user)) -> UserOut:
        """
        Valida si el rol del usuario actual está en la lista de roles permitidos.

        Esta función se inyecta en los endpoints y realiza la comprobación de
        permisos. Si el usuario no está autenticado, la dependencia
        `get_current_active_user` ya habrá lanzado un error 401.

        Args:
            current_user: El modelo del usuario autenticado, inyectado por la
                          dependencia `get_current_active_user`.

        Raises:
            HTTPException (403 Forbidden): Si el rol del usuario no está en la
                                          lista de `allowed_roles`.

        Returns:
            El objeto `UserOut` del usuario actual si su rol es válido, permitiendo
            que la ejecución del endpoint continúe.
        """
        
        # [CORRECCIÓN CRÍTICA] Se compara el rol del usuario (string) con el
        # valor del Enum (role.value), que también es un string.
        user_role_str = current_user.role
        
        # Regla 1: Acceso universal e implícito para el SUPERADMIN.
        if user_role_str == UserRole.SUPERADMIN.value:
            logger.debug(f"Acceso Permitido (SUPERADMIN): Usuario '{current_user.username}' tiene acceso universal.")
            return current_user

        # Se crea una lista de strings con los valores de los roles permitidos.
        allowed_role_values = [role.value for role in allowed_roles]

        # Regla 2: Verificación estándar para todos los demás roles.
        if user_role_str not in allowed_role_values:
            logger.warning(f"Acceso Denegado: Rol '{user_role_str}' del usuario '{current_user.username}' no está en la lista permitida: {allowed_role_values}")
            
            # Se lanza una excepción HTTP estándar con detalles claros.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene los permisos necesarios para realizar esta acción."
            )
        
        # Si la validación es exitosa, se concede el acceso.
        logger.debug(f"Acceso Permitido: Rol '{user_role_str}' del usuario '{current_user.username}' es válido para este endpoint.")
        return current_user

    # La factoría retorna la dependencia interna para que FastAPI la utilice.
    return check_roles