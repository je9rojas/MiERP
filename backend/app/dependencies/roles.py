# /backend/app/dependencies/roles.py
# VERSIÓN FINAL CON IMPORTACIÓN MODULAR CORREGIDA

from typing import List
from fastapi import Depends, HTTPException, status
from app.modules.users.user_models import UserRole, UserOut

# --- ¡IMPORTACIÓN CORREGIDA! ---
# Apuntamos a la nueva ubicación de la dependencia de autenticación
# y usamos el nuevo nombre más descriptivo.
from app.modules.auth.auth_routes import get_current_active_user

def role_checker(allowed_roles: List[UserRole]):
    """
    Crea una dependencia de FastAPI que verifica si el usuario actual
    tiene uno de los roles permitidos.
    """
    def check_roles(current_user: UserOut = Depends(get_current_active_user)) -> UserOut:
        # La dependencia 'get_current_active_user' ya nos da un modelo UserOut,
        # lo que hace que el acceso a 'current_user.role' sea seguro y con autocompletado.
        if current_user.role not in allowed_roles:
            print(f"❌ Acceso Denegado: Rol '{current_user.role}' no está en la lista de roles permitidos.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción."
            )
        print(f"✅ Acceso Permitido: Rol '{current_user.role}' es válido.")
        return current_user

    return check_roles