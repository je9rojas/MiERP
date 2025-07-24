# /backend/app/core/config.py

"""
Define y valida de forma centralizada todas las variables de configuración de la aplicación.
Utiliza `pydantic-settings` para cargar automáticamente estas variables desde el entorno
o desde un archivo .env, asegurando que los tipos de datos sean correctos desde el arranque.
"""

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    """
    Modelo de configuración que define todas las variables de entorno requeridas por la aplicación.
    """

    # --- SECCIÓN 1: METADATOS DEL PROYECTO ---
    PROJECT_NAME: str = "MiERP PRO"
    PROJECT_VERSION: str = "1.0.0"
    
    # --- SECCIÓN 2: CONFIGURACIÓN DE SEGURIDAD ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- SECCIÓN 3: CONFIGURACIÓN DE LA BASE DE DATOS ---
    MONGODB_URI: str
    MONGODB_DATABASE_NAME: Optional[str] = None

    # --- SECCIÓN 4: CONFIGURACIÓN DEL ENTORNO Y CORS ---
    ENV: str = "development"
    
    # --- ¡CORRECCIÓN CLAVE! ---
    # Se define el tipo como una Lista de 'AnyHttpUrl' para una validación más estricta.
    # No se proporciona un valor por defecto en el código; el valor DEBE provenir
    # del archivo .env. Esto obliga a que el archivo .env esté correctamente configurado.
    ALLOWED_ORIGINS: List[AnyHttpUrl]

    # --- SECCIÓN 5: CONFIGURACIONES ADICIONALES ---
    ENABLE_CREDENTIAL_ROTATION: bool = False
    CREDENTIAL_ROTATION_DAYS: int = 90
    SECRETS_MANAGER: str = "file"

    # --- SECCIÓN 6: CONFIGURACIÓN INTERNA DE PYDANTIC ---
    # Se utiliza SettingsConfigDict para una configuración más moderna y explícita.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

# Se crea una instancia única de la configuración que se importará en toda la aplicación.
# Este patrón singleton asegura que las variables se lean y validen una sola vez.
settings = Settings()