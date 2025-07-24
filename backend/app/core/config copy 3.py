# /backend/app/core/config.py

"""
Módulo de Configuración Central de la Aplicación.
Utiliza Pydantic V2 con pydantic-settings para cargar, validar y gestionar
las variables de entorno de forma segura y tipada.
"""

import os
from typing import List
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Define todas las variables de entorno que la aplicación necesita para funcionar.
    Pydantic las validará automáticamente al iniciar la aplicación.
    """
    
    # --- Configuración del Entorno de la Aplicación ---
    ENV: str = "development"
    PROJECT_NAME: str = "MiERP PRO"
    PROJECT_VERSION: str = "1.0.0"

    # --- Configuración de la Base de Datos ---
    MONGODB_URI: str
    MONGODB_DATABASE_NAME: str = "midb"

    # --- Configuración de Seguridad ---
    SECRET_KEY: str
    
    # El tipo `List[AnyHttpUrl]` le indica a Pydantic que debe parsear el valor
    # de la variable de entorno como una lista JSON de URLs válidas.
    ALLOWED_ORIGINS: List[AnyHttpUrl] = []

    # --- ¡CORRECCIÓN CLAVE Y MEJORA PROFESIONAL! ---
    # `model_config` es la forma moderna en Pydantic V2 de configurar el comportamiento.
    model_config = SettingsConfigDict(
        # Hace que la coincidencia de variables de entorno sea insensible a mayúsculas/minúsculas.
        case_sensitive=False,
        
        # Especifica explícitamente el nombre del archivo a buscar y su codificación.
        # Esto soluciona problemas donde `python-dotenv` no encuentra el archivo por defecto.
        env_file=".env",
        env_file_encoding="utf-8"
    )

# Se crea una única instancia global de la configuración para ser importada
# en cualquier parte de la aplicación.
settings = Settings()