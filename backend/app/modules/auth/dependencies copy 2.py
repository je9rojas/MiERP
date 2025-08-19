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
    Dependencia de alto nivel para proteger endpoints, asegurando que el
    usuario del token esté activo y devolviendo un modelo seguro (UserOut).
    """
    if current_user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El usuario está inactivo.")
    
    # --- CORRECCIÓN CLAVE ---
    # Se convierte explícitamente el objeto `current_user` (de tipo UserInDB) a un diccionario
    # antes de pasarlo a `UserOut.model_validate`. Pydantic v2 requiere este paso para
    # poder validar y crear una instancia de un modelo a partir de los datos de otro.
    
    return UserOut.model_validate(current_user.model_dump())


