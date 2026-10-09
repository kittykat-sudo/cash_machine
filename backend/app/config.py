import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@db:5432/cash_register"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "chathura-printers-super-secret-jwt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    APP_TIMEZONE: str = os.getenv("APP_TIMEZONE", "Asia/Colombo")
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "LKR")
    SHOP_NAME: str = "Chathura Printers"
    SHOP_PHONE: str = "071-2345678"
    SHOP_ADDRESS: str = "Main Street, Colombo"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
