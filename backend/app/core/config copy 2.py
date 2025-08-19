# backend/app/core/config.py

"""
Módulo de Configuración Central de la Aplicación.

Utiliza Pydantic (pydantic-settings) para cargar, validar y gestionar
las variables de entorno de forma segura y tipada. Este archivo define el "contrato"
de todas las configuraciones que la aplicación espera, sirviendo como única
fuente de verdad para la configuración.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import json
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DE CONFIGURACIÓN
# ==============================================================================

class Settings(BaseSettings):
    """
    Define y valida todas las variables de entorno que la aplicación necesita.
    Los valores se cargan desde el entorno del sistema o desde un archivo .env.
    """

    # --- Configuración General de la Aplicación ---
    ENV: str = Field(
        "development",
        description="Entorno de ejecución ('development', 'staging', 'production')."
    )
    PROJECT_NAME: str = Field("MiERP PRO", description="Nombre del proyecto.")
    PROJECT_VERSION: str = Field("1.0.0", description="Versión del proyecto.")

    # --- Configuración de la Base de Datos (OBLIGATORIA) ---
    DATABASE_URL: str = Field(
        ...,
        description="URI de conexión completa a MongoDB Atlas, incluyendo el nombre de la base de datos.",
        example="mongodb+srv://user:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority"
    )

    # --- Configuración de Seguridad y CORS (OBLIGATORIA) ---
    SECRET_KEY: str = Field(
        ...,
        description="Clave secreta para firmar tokens JWT. Debe ser larga y aleatoria."
    )
    # CORRECCIÓN: Se acepta un string o una lista, que será procesado por el validador.
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(
        default_factory=list,
        description="Lista de orígenes (URLs de frontend) con permiso para acceder a esta API. Formato: '[\"url1\", \"url2\"]' o 'url1,url2'."
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """
        Procesa la variable de entorno ALLOWED_ORIGINS para asegurar que siempre sea una lista de strings.
        """
        if isinstance(v, list):
            return v
        if isinstance(v, str) and not v.startswith("["):
            # Si es un string simple separado por comas
            return [origin.strip() for origin in v.split(",")]
        if isinstance(v, str) and v.startswith("["):
            # Si es un string que parece una lista (ej: '["url1", "url2"]')
            try:
                # Se usa json.loads para parsear el string a una lista de Python
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("El string de ALLOWED_ORIGINS no es un JSON array válido.")
        
        raise ValueError("Formato de ALLOWED_ORIGINS no reconocido.")


    # --- Configuración de JSON Web Tokens (JWT) ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        30,
        description="Duración en minutos para la expiración de los tokens de acceso."
    )
    ALGORITHM: str = Field(
        "HS256",
        description="Algoritmo de firma para los tokens JWT."
    )

    # --- Credenciales del Superadministrador Inicial ---
    SUPERADMIN_EMAIL: str = Field(
        ...,
        description="Email para la creación del usuario superadministrador inicial."
    )
    SUPERADMIN_PASSWORD: str = Field(
        ...,
        description="Contraseña para el usuario superadministrador inicial. Será hasheada al crear."
    )

    # --- Configuración del comportamiento de pydantic-settings ---
    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=".env",
        env_file_encoding="utf-8"
    )

# ==============================================================================
# SECCIÓN 3: INSTANCIA GLOBAL DE LA CONFIGURACIÓN
# ==============================================================================

settings = Settings()

