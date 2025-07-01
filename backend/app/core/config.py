from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    SECRET_KEY: str = "tu-clave-secreta-segura-aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 90
    MONGODB_URI: str
    ENV: str = "development"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    ENABLE_CREDENTIAL_ROTATION: bool = False
    CREDENTIAL_ROTATION_DAYS: int = 90
    SECRETS_MANAGER: str = "file"
    
    # Opcional: Si necesitas mantener compatibilidad temporal
    SUPERADMIN_INITIAL_PASSWORD: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignorar variables extra en .env

settings = Settings()