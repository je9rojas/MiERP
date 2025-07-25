# /backend/app/modules/auth/dependencies.py

"""
Módulo de Dependencias de Autenticación.

Este archivo define las dependencias de FastAPI reutilizables para todo el sistema
de autenticación y autorización. Su propósito es:
1.  Centralizar la lógica de validación de tokens y recuperación de usuarios.
2.  Proporcionar funciones de "guardia" fáciles de usar para proteger los endpoints.
3.  Mejorar la modularidad y prevenir importaciones circulares, al separar la lógica
    de las dependencias de la lógica de las rutas.
"""

# --- SECCIÓN 1: IMPORTACIONES ---

# Importaciones de librerías de terceros
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

# Importaciones de módulos de la propia aplicación
from app.core.config import settings
from app.core.database import get_db
from app.modules.users.user_models import UserInDB, UserOut
from app.modules.auth import auth_service
from app.modules.auth.auth_models import TokenPayload


# --- SECCIÓN 2: CONFIGURACIÓN DEL ESQUEMA DE SEGURIDAD ---

# Se define el esquema de seguridad OAuth2. FastAPI lo utilizará para generar la
# documentación de la API y para extraer el token 'Bearer' de la cabecera 'Authorization'.
# La 'tokenUrl' apunta al endpoint de login para que la UI de Swagger pueda autenticarse.
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)


# --- SECCIÓN 3: DEPENDENCIA DE BAJO NIVEL (VALIDACIÓN DE TOKEN Y BÚSQUEDA EN BD) ---

async def get_current_user(
    database: AsyncIOMotorDatabase = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> UserInDB:
    """
    Dependencia de bajo nivel que realiza la validación crítica del token JWT.

    Pasos que realiza:
    1. Decodifica el token JWT usando la clave secreta y el algoritmo configurados.
    2. Valida la estructura del contenido (payload) contra el modelo TokenPayload.
    3. Extrae el nombre de usuario ('sub') del payload.
    4. Busca al usuario en la base de datos usando el servicio de autenticación.
    5. Retorna el modelo completo del usuario desde la base de datos (UserInDB).

    Esta función es el núcleo de la seguridad basada en tokens y es la base para
    las dependencias de más alto nivel.

    Raises:
        HTTPException(401): Si el token es inválido, ha expirado, no tiene el formato
                             correcto o el usuario no se encuentra en la base de datos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales del usuario.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # Se valida el contenido del token contra el modelo Pydantic para asegurar su estructura.
        token_data = TokenPayload(**payload)

    except (JWTError, ValidationError):
        # Si la decodificación falla o el payload no es válido, se lanza la excepción.
        raise credentials_exception

    # Se utiliza el servicio de autenticación para obtener el documento completo del usuario.
    # Es crucial usar 'get_user_by_username_for_auth' porque devuelve el hash de la contraseña,
    # necesario para construir el modelo UserInDB.
    user_document = await auth_service.get_user_by_username_for_auth(
        db=database, username=token_data.sub
    )

    if user_document is None:
        raise credentials_exception

    # Se retorna una instancia del modelo Pydantic UserInDB, que contiene todos los datos.
    return UserInDB(**user_document)


# --- SECCIÓN 4: DEPENDENCIA DE ALTO NIVEL (PROTECCIÓN DE ENDPOINTS) ---

async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserOut:
    """
    Dependencia de alto nivel, diseñada para ser usada directamente en los endpoints.

    Esta función se apoya en `get_current_user` y añade una capa de lógica de negocio:
    1. Verifica que el usuario autenticado tenga el estado "active".
    2. Convierte el modelo interno `UserInDB` a un modelo seguro `UserOut`,
       eliminando campos sensibles como el hash de la contraseña antes de que
       pueda ser usado en la lógica del endpoint.

    Returns:
        Un objeto UserOut, seguro para ser expuesto y enviado como respuesta.

    Raises:
        HTTPException(400): Si el usuario recuperado del token no está activo.
    """
    if current_user.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario está inactivo.")

    # --- SOLUCIÓN AL ERROR DE VALIDACIÓN ---
    # Se convierte el objeto 'current_user' (tipo UserInDB) a un diccionario usando .model_dump().
    # Pydantic v2 requiere esta conversión explícita para validar los datos en un modelo diferente (UserOut).
    # Este paso asegura que solo los campos definidos en UserOut se incluyan en el objeto final.
    return UserOut.model_validate(current_user.model_dump(mode='python'))