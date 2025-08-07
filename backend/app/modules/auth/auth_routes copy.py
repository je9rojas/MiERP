# /backend/app/modules/auth/auth_routes.py

"""
Define los endpoints de la API para la autenticación y gestión de perfiles.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
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

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(
    db: AsyncIOMotorDatabase = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Autentica a un usuario y devuelve un token de acceso junto con sus datos.
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
        "token_type": "bearer",
        "user": UserOut.model_validate(user_doc)
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
    Verifica si el token de un usuario es válido y devuelve sus datos.
    """
    return {"status": "ok", "user": current_user}