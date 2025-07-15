# /backend/app/core/config.py
# CONFIGURACIÓN CENTRALIZADA DE LA APLICACIÓN USANDO PYDANTIC

from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    """
    Define todas las variables de configuración de la aplicación.
    Pydantic cargará automáticamente estas variables desde el sistema de entorno
    o desde un archivo .env, validando sus tipos.
    """

    # --- SECCIÓN 1: METADATOS DEL PROYECTO ---
    PROJECT_NAME: str = "MiERP PRO"
    PROJECT_VERSION: str = "1.0.0"
    
    # --- SECCIÓN 2: CONFIGURACIÓN DE SEGURIDAD ---
    SECRET_KEY: str = "una-clave-secreta-muy-larga-y-dificil-de-adivinar-que-debes-cambiar"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 # Se recomienda un tiempo de vida más corto para los tokens

    # --- SECCIÓN 3: CONFIGURACIÓN DE LA BASE DE DATOS ---
    MONGODB_URI: str
    MONGODB_DATABASE_NAME: Optional[str] = None # Hacerlo opcional por si viene en la URI

    # --- SECCIÓN 4: CONFIGURACIÓN DEL ENTORNO Y CORS ---
    ENV: str = "development"
    # Lista de orígenes permitidos para comunicarse con la API
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # --- SECCIÓN 5: CONFIGURACIONES ADICIONALES (OPCIONALES) ---
    ENABLE_CREDENTIAL_ROTATION: bool = False
    CREDENTIAL_ROTATION_DAYS: int = 90
    SECRETS_MANAGER: str = "file"


    class Config:
        """
        Configuración interna de Pydantic para indicarle cómo cargar las variables.
        """
        # Lee las variables de un archivo .env ubicado en el mismo directorio
        # que el script que se ejecuta (normalmente, la raíz del backend).
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Ignora cualquier variable extra en el archivo .env que no esté definida en este modelo.
        extra = "ignore" 

# Creamos una instancia única de la configuración que se importará en toda la aplicación.
# Este patrón asegura que las variables de entorno se lean y validen una sola vez.
settings = Settings()