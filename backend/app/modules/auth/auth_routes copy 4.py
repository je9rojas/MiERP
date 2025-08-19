# /backend/app/modules/auth/auth_routes.py

"""
[VERSIÓN DE DEPURACIÓN] Define los endpoints de la API para la autenticación,
gestión de perfiles y verificación de tokens.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.modules.users.user_models import UserOut
from . import auth_service
from .dependencies import get_current_active_user

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DE SEGURIDAD Y ROUTER
# ==============================================================================

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

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
    """Define la estructura de la respuesta para el endpoint de verificación de token."""
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
    """Autentica a un usuario y devuelve un token de acceso."""
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
    """Devuelve el perfil del usuario actualmente autenticado."""
    return current_user

@router.get(
    "/verify-token",
    response_model=VerifyTokenResponse,
    summary="Verificar Token de Sesión"
)
async def verify_token_route(current_user: UserOut = Depends(get_current_active_user)):
    """
    Endpoint para que el frontend verifique si un token almacenado es válido.
    La validación ocurre en la dependencia `get_current_active_user`.
    """
    # --- LOG DE DEPURACIÓN ---
    print("\n[BACKEND_DEBUG] 1. Petición LLEGÓ a la función `verify_token_route`.")
    print(f"[BACKEND_DEBUG] 2. La dependencia `get_current_active_user` se resolvió exitosamente.")
    print(f"[BACKEND_DEBUG] 3. Usuario obtenido de la dependencia: {current_user.username}")
    
    response_data = {"status": "ok", "user": current_user}
    
    print("[BACKEND_DEBUG] 4. A punto de enviar la respuesta al cliente.")
    # --- FIN LOG ---
    
    return response_data