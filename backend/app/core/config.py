# /backend/app/core/config.py

"""
Módulo de Configuración Central de la Aplicación.
Utiliza Pydantic V2 con pydantic-settings para cargar, validar y gestionar
las variables de entorno de forma segura y tipada.
Este archivo define el "contrato" de todas las configuraciones que la aplicación espera.
"""

from typing import List, Optional
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Define todas las variables de entorno que la aplicación necesita para funcionar.
    Pydantic las validará automáticamente. Si una variable existe en el archivo .env,
    su valor anulará el valor por defecto definido aquí.
    """
    
    # --- Configuración del Entorno de la Aplicación ---
    ENV: str = "development"
    PROJECT_NAME: str = "MiERP PRO"
    PROJECT_VERSION: str = "1.0.0"

    # --- Configuración de la Base de Datos ---
    MONGODB_URI: str
    MONGODB_DATABASE_NAME: Optional[str] = None

    # --- Configuración de Seguridad y CORS ---
    SECRET_KEY: str
    ALLOWED_ORIGINS: List[AnyHttpUrl] = []

    # --- Configuración de JWT (JSON Web Tokens) ---
    # Se definen aquí los campos que el módulo de autenticación necesita.
    # Se les asigna un valor por defecto seguro.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # El token expira en 30 minutos por defecto.
    ALGORITHM: str = "HS256"

    # --- Configuración de Funcionalidades Adicionales ---
    ENABLE_CREDENTIAL_ROTATION: bool = False
    CREDENTIAL_ROTATION_DAYS: int = 90

    # Configuración del comportamiento de pydantic-settings
    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=".env",
        env_file_encoding="utf-8"
    )

# Se crea una única instancia global de la configuración para ser importada en la aplicación.
settings = Settings()