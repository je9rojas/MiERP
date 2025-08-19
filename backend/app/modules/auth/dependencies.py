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
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

from app.core.config import settings
from app.core.database import get_db
from app.modules.users.user_models import UserInDB, UserOut
from . import auth_service
from .auth_models import TokenPayload

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ESQUEMA DE SEGURIDAD
# ==============================================================================

# Se define el esquema OAuth2 aquí, ya que es la dependencia fundamental.
# Las rutas y otras dependencias lo importarán desde este único lugar,
# rompiendo así la importación circular.
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)

# ==============================================================================
# SECCIÓN 3: DEPENDENCIAS DE AUTENTICACIÓN
# ==============================================================================

async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> UserInDB:
    """
    Dependencia de bajo nivel que valida el token JWT y recupera el usuario
    completo de la base de datos (modelo InDB).
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
        # Se añade validación explícita del esquema del payload del token.
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
    Dependencia de alto nivel para proteger endpoints.
    
    Verifica que el usuario obtenido del token esté activo y devuelve un
    modelo seguro (UserOut), listo para ser usado en las rutas.
    """
    if current_user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El usuario está inactivo.")
    
    # Pydantic v2 con `from_attributes=True` en el modelo `UserOut` puede
    # crear una instancia directamente desde otro modelo Pydantic (UserInDB).
    return UserOut.model_validate(current_user)