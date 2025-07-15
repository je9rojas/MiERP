# /backend/app/modules/auth/auth_routes.py
# GESTOR DE RUTAS PARA AUTENTICACIÓN Y PERFILES DE USUARIO

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Dict, Any

# --- SECCIÓN 1: IMPORTACIONES ---

# Lógica del núcleo de la aplicación
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token

# Lógica y modelos de otros módulos
from app.modules.users.user_models import UserOut
from . import auth_service

# --- SECCIÓN 2: CONFIGURACIÓN DEL ROUTER Y SEGURIDAD ---

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Define el esquema de seguridad OAuth2.
# `tokenUrl` es la ruta relativa al prefijo del router donde el frontend obtendrá el token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") 

# --- SECCIÓN 3: DEPENDENCIA DE AUTENTICACIÓN ---

async def get_current_active_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserOut:
    """
    Dependencia de FastAPI para validar un token JWT y obtener el usuario actual.
    - Decodifica el token.
    - Obtiene el usuario de la base de datos.
    - Valida que el usuario exista y esté activo.
    - Devuelve el usuario como un modelo Pydantic `UserOut`.
    
    Esta dependencia se puede reutilizar en cualquier endpoint que requiera un usuario autenticado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await auth_service.get_user_by_username(db=db, username=username)
    if user is None:
        raise credentials_exception
    
    # Convertimos el diccionario devuelto por el servicio a un modelo Pydantic.
    # Esto asegura que los datos siempre tengan la forma correcta.
    user_out = UserOut(**user)
    
    if user_out.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo")
        
    return user_out

# --- SECCIÓN 4: ENDPOINTS DE LA API ---

# Definimos el modelo de respuesta para el login para mayor claridad y autodocumentación.
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Autentica a un usuario con 'username' y 'password' y devuelve un token de acceso.
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
    
    # Usamos el modelo UserOut para asegurar que solo devolvemos datos seguros.
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
async def verify_token(current_user: UserOut = Depends(get_current_active_user)):
    """
    Endpoint para que el frontend pueda verificar rápidamente si un token es válido.
    Si la dependencia 'get_current_active_user' tiene éxito, el token es válido.
    """
    return {"status": "ok", "message": "Token is valid", "user": current_user}