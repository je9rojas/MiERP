# /backend/app/modules/auth/auth_routes.py

"""
Define los endpoints de la API para la autenticación, gestión de perfiles y
verificación de tokens. Este módulo es el punto de entrada para todas las
operaciones relacionadas con la sesión del usuario.
"""

# =-============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.modules.users.user_models import UserOut
from . import auth_service
from .dependencies import get_current_active_user, reusable_oauth2 # <- CORRECCIÓN: Se importa reusable_oauth2

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL ROUTER
# ==============================================================================

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# ==============================================================================
# SECCIÓN 3: MODELOS DE RESPUESTA DE LA API
# ==============================================================================

class TokenResponse(BaseModel):
    """Define la estructura de la respuesta para el endpoint de login."""
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class VerifyTokenResponse(BaseModel):
    """
    Define la estructura de la respuesta para el endpoint de verificación de token.
    Al ser explícito, garantiza que Pydantic serialice correctamente el objeto anidado 'user'.
    """
    status: str
    user: UserOut

# ==============================================================================
# SECCIÓN 4: ENDPOINTS DE LA API
# ==============================================================================

@router.post("/login", response_model=TokenResponse, summary="Iniciar Sesión")
async def login_for_access_token(
    db: AsyncIOMotorDatabase = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Autentica a un usuario con nombre de usuario y contraseña.

    Si las credenciales son válidas, devuelve un token de acceso JWT y el
    objeto completo del usuario.
    """
    user_doc = await auth_service.authenticate_user(
        db=db, username=form_data.username, password=form_data.password
    )
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["username"], "role": user_doc["role"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "user": UserOut.model_validate(user_doc)
    }

@router.get("/profile", response_model=UserOut, summary="Obtener Perfil del Usuario")
async def get_user_profile(current_user: UserOut = Depends(get_current_active_user)):
    """
    Devuelve el perfil del usuario actualmente autenticado a través del token.
    """
    return current_user

@router.get(
    "/verify-token",
    response_model=VerifyTokenResponse,
    summary="Verificar Token de Sesión"
)
async def verify_token_route(current_user: UserOut = Depends(get_current_active_user)):
    """
    Endpoint para que el frontend verifique si un token almacenado es válido.

    La validación ocurre implícitamente en la dependencia `get_current_active_user`.
    Si la dependencia se resuelve, el token es válido y se devuelve el usuario.
    """
    return {"status": "ok", "user": current_user}