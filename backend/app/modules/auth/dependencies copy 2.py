# /backend/app/modules/auth/dependencies.py

"""
Módulo de Dependencias de Autenticación.

Este archivo define las dependencias de FastAPI reutilizables para todo el sistema
de autenticación y autorización. Su propósito es centralizar la lógica de
validación de tokens y recuperación de usuarios, proporcionando "guardianes"
reutilizables y seguros para proteger los endpoints de la API.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

from app.core.config import settings
from app.core.database import get_db
from app.modules.users.user_models import UserInDB, UserOut
from app.modules.auth import auth_service
from app.modules.auth.auth_models import TokenPayload
from app.modules.auth.auth_routes import reusable_oauth2

# ==============================================================================
# SECCIÓN 2: DEPENDENCIAS DE AUTENTICACIÓN
# ==============================================================================

async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> UserInDB:
    """
    Dependencia de bajo nivel que valida el token JWT y recupera al usuario.

    Esta función es el núcleo de la seguridad basada en tokens. Realiza los siguientes pasos:
    1. Decodifica el token JWT.
    2. Valida la estructura del payload del token.
    3. Extrae el nombre de usuario ('sub').
    4. Busca al usuario en la base de datos.
    5. Retorna el modelo completo del usuario desde la base de datos (`UserInDB`).

    Args:
        db: Dependencia para obtener la sesión de la base de datos.
        token: Dependencia para extraer el token 'Bearer' de la cabecera 'Authorization'.

    Returns:
        Una instancia del modelo Pydantic `UserInDB` con todos los datos del usuario.

    Raises:
        HTTPException(401): Si el token es inválido, ha expirado, tiene un formato
                             incorrecto, o si el usuario no se encuentra.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload.model_validate(payload)
    except (JWTError, ValidationError):
        raise credentials_exception

    user_document = await auth_service.get_user_by_username_for_auth(
        db=db, username=token_data.sub
    )
    if user_document is None:
        raise credentials_exception

    return UserInDB.model_validate(user_document)


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserOut:
    """
    Dependencia de alto nivel, diseñada para ser usada directamente en los endpoints.

    Esta función se apoya en `get_current_user` y añade una capa de lógica de negocio:
    1. Verifica que el usuario autenticado tenga el estado "active".
    2. Convierte el modelo interno `UserInDB` a un modelo seguro `UserOut`,
       eliminando campos sensibles como el hash de la contraseña.

    Args:
        current_user: El resultado de la dependencia `get_current_user`.

    Returns:
        Un objeto `UserOut`, seguro para ser expuesto y enviado como respuesta de la API.

    Raises:
        HTTPException(403): Si el usuario recuperado del token no está activo.
    """
    if current_user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El usuario está inactivo.")
    
    return UserOut.model_validate(current_user)