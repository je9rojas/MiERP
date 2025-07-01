from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SECRET_KEY: str = "tu-clave-secreta-segura-aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MONGODB_URI: str
    ENV: str = "development"  # 'production' o 'development'
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    ENABLE_CREDENTIAL_ROTATION: bool = False
    CREDENTIAL_ROTATION_DAYS: int = 90
    SECRETS_MANAGER: str = "file"  # 'aws', 'azure', 'vault' o 'file'
    SECRETS_MANAGER_CONFIG: dict = {}
    
    class Config:
        env_file = ".env"

settings = Settings()