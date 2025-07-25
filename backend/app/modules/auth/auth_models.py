# /backend/app/modules/auth/auth_models.py

"""
Define los modelos de datos de Pydantic específicos para el módulo de Autenticación.
Estos modelos se utilizan para la validación de datos relacionados con tokens y credenciales.
"""

from pydantic import BaseModel


class TokenPayload(BaseModel):
    """
    Define la estructura esperada del payload (contenido) dentro de un token JWT.
    Pydantic utiliza este modelo para validar que el token decodificado
    contenga la información necesaria.
    """
    sub: str | None = None


class Token(BaseModel):
    """
    Define la estructura de la respuesta que se envía al cliente
    después de un login exitoso.
    """
    access_token: str
    token_type: str