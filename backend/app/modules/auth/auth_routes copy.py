# backend/app/modules/auth/auth_routes.py
# CÓDIGO FINAL Y CORREGIDO SIN LA IMPORTACIÓN CIRCULAR

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from . import auth_service
from app.core.security import create_access_token
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login") # Usar la ruta completa para claridad

# Definición de la dependencia para obtener el usuario actual
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncIOMotorDatabase = Depends(get_db)
):
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
    return user

# Endpoint de Login
@router.post("/login", response_model=dict)
async def login(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    client_ip = request.client.host
    print(f"--- [AUTH LOGIN] Intento de login recibido del usuario '{form_data.username}' desde la IP: {client_ip} ---")

    try:
        print(f"[AUTH LOGIN] Paso 1: Autenticando credenciales para '{form_data.username}'...")
        user = await auth_service.authenticate_user(
            db=db, username=form_data.username, password=form_data.password
        )
        
        if not user:
            print(f"[AUTH LOGIN] ❌ Fallo: Credenciales incorrectas para '{form_data.username}'.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"[AUTH LOGIN] ✅ Paso 2: Autenticación exitosa para '{form_data.username}'.")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"sub": user["username"], "role": user["role"]}
        
        print(f"[AUTH LOGIN] Paso 3: Creando token de acceso con data: {token_data}")
        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )
        
        user_info = {"username": user["username"], "name": user["name"], "role": user["role"]}
        response_data = {"access_token": access_token, "token_type": "bearer", "user": user_info}
        
        print(f"[AUTH LOGIN] ✅ Paso 4: Login completado. Enviando token y datos de usuario.")
        return response_data

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"[AUTH LOGIN] ❌ ERROR INESPERADO: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor durante el login."
        )

# Endpoint para obtener el perfil del usuario logueado
@router.get("/profile", response_model=dict)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return current_user

# Endpoint para verificar la validez de un token
@router.get("/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    return {"status": "ok", "user": current_user}