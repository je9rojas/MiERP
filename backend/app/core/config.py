# /backend/app/core/config.py

"""
Módulo de Configuración Central de la Aplicación.

Utiliza Pydantic para cargar, validar y gestionar las variables de entorno
de forma segura y tipada. Este archivo define el "contrato" de todas las
configuraciones que la aplicación espera, sirviendo como única fuente de
verdad para la configuración.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import json
from typing import List, Union, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DE CONFIGURACIÓN
# ==============================================================================

class Settings(BaseSettings):
    """
    Define y valida todas las variables de entorno que la aplicación necesita.
    """

    # --- Configuración General de la Aplicación ---
    ENV: str = Field("development", description="Entorno de ejecución.")
    PROJECT_NAME: str = Field("MiERP PRO", description="Nombre del proyecto.")
    PROJECT_VERSION: str = Field("1.0.0", description="Versión del proyecto.")
    API_V1_PREFIX: str = Field("/api/v1", description="Prefijo para la API v1.")

    # --- Configuración de la Base de Datos (OBLIGATORIA) ---
    DATABASE_URL: str = Field(..., description="URI de conexión a MongoDB Atlas.")
    # --- CORRECCIÓN ---
    # Se añaden los nombres de las bases de datos como variables configurables.
    # Esto permite que el mismo código se conecte a diferentes bases de datos
    # (producción, archivo, testing) simplemente cambiando el entorno.
    MONGO_PROD_DB_NAME: str = Field("mi_erp_prod", description="Nombre de la base de datos de producción.")
    MONGO_ARCHIVE_DB_NAME: str = Field("mi_erp_archive", description="Nombre de la base de datos de archivo histórico.")


    # --- Configuración de Seguridad y CORS (OBLIGATORIA) ---
    SECRET_KEY: str = Field(..., description="Clave secreta para firmar tokens JWT.")
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(default_factory=list, description="Orígenes CORS permitidos.")

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",")]
        if isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("ALLOWED_ORIGINS no es un JSON array válido.")
        raise ValueError("Formato de ALLOWED_ORIGINS no reconocido.")

    # --- Configuración de JSON Web Tokens (JWT) ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60 * 24 * 8, description="Expiración del token de acceso en minutos.")
    ALGORITHM: str = Field("HS256", description="Algoritmo de firma JWT.")

    # --- Credenciales del Superadministrador Inicial ---
    SUPERADMIN_EMAIL: str = Field(..., description="Email del superadmin inicial.")
    SUPERADMIN_PASSWORD: str = Field(..., description="Contraseña del superadmin inicial.")

    # --- Información de la Empresa para Documentos ---
    COMPANY_NAME: str = Field("Nombre de Mi Empresa S.A.C.", description="Razón social completa de la empresa.")
    COMPANY_RUC: str = Field("20123456789", description="Número de RUC de la empresa.")
    COMPANY_ADDRESS: Optional[str] = Field(None, description="Dirección fiscal de la empresa.")
    COMPANY_PHONE: Optional[str] = Field(None, description="Teléfono de contacto de la empresa.")
    COMPANY_EMAIL: Optional[str] = Field(None, description="Email de contacto de la empresa.")
    COMPANY_LOGO_PATH: Optional[str] = Field(None, description="Ruta a un archivo de logo para los reportes.")

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