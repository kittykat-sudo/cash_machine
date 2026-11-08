import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

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
    SHOP_NAME: str = os.getenv("SHOP_NAME", "Chathura Printers")
    SHOP_PHONE: str = os.getenv("SHOP_PHONE", "072 0129297 / 077-8683088")
    SHOP_WHATSAPP_NUMBER: str = os.getenv("SHOP_WHATSAPP_NUMBER", "0720129297")
    SHOP_ADDRESS: str = os.getenv("SHOP_ADDRESS", "No. 6A, Sri Hemananda Mw, Joolgaha, Galle")

    # WhatsApp Integration Settings
    WHATSAPP_MODE: str = os.getenv("WHATSAPP_MODE", "bridge")  # 'bridge' | 'click_to_chat' | 'cloud_api' | 'twilio'
    WHATSAPP_BRIDGE_URL: str = os.getenv("WHATSAPP_BRIDGE_URL", "http://whatsapp-bridge:3001")
    WHATSAPP_DEFAULT_COUNTRY_CODE: str = os.getenv("WHATSAPP_DEFAULT_COUNTRY_CODE", "94")
    # Meta WhatsApp Cloud API credentials (optional, when mode == 'cloud_api')
    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    # Twilio WhatsApp credentials (optional, when mode == 'twilio')
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
