# /backend/app/modules/auth/auth_routes.py

"""
Define los endpoints de la API para la autenticación, gestión de perfiles y verificación de tokens.
Este archivo se centra en la definición de las rutas y delega la lógica de negocio a la capa de servicio
y la lógica de validación de usuarios a las dependencias.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# --- SECCIÓN 1: IMPORTACIONES ---

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.modules.users.user_models import UserOut
from . import auth_service
from .dependencies import get_current_active_user


# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER ---

router = APIRouter(prefix="/auth", tags=["Autenticación"])


# --- SECCIÓN 3: MODELOS DE RESPUESTA DE LA API ---

class TokenResponse(BaseModel):
    """Define la estructura de la respuesta para el endpoint de login."""
    access_token: str
    token_type: str
    user: UserOut


# --- SECCIÓN 4: ENDPOINTS DE LA API ---

@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Autentica a un usuario con 'username' y 'password' y devuelve un token de acceso y los datos del usuario.
    """
    client_ip = request.client.host
    print(f"--- [AUTH LOGIN] Intento de login para '{form_data.username}' desde IP: {client_ip} ---")

    user_doc = await auth_service.authenticate_user(
        db=db, username=form_data.username, password=form_data.password
    )
    if not user_doc:
        print(f"❌ Fallo de autenticación para '{form_data.username}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print(f"✅ Autenticación exitosa para '{form_data.username}'.")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["username"], "role": user_doc["role"]},
        expires_delta=access_token_expires
    )
    
    user_info = UserOut(**user_doc)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

@router.get("/profile", response_model=UserOut)
async def get_user_profile(current_user: UserOut = Depends(get_current_active_user)):
    """
    Devuelve el perfil del usuario actualmente autenticado.
    """
    return current_user

@router.get("/verify-token", response_model=Dict[str, Any])
async def verify_token_route(current_user: UserOut = Depends(get_current_active_user)):
    """
    Endpoint para que el frontend pueda verificar rápidamente si un token almacenado es válido.
    La validación ocurre implícitamente en la dependencia 'get_current_active_user'.
    """
    return {"status": "ok", "message": "Token is valid", "user": current_user}