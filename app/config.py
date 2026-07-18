from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

import os

_base_config = SettingsConfigDict(
    env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),
    env_ignore_empty=True,
    extra="ignore",
)

class AppSettings(BaseSettings):
    APP_NAME:str ="FastShip"
    APP_DOMAIN:str="localhost:8000"
class DatabaseSettings(BaseSettings):
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "fastship"
    # Use "sqlite" to fallback to SQLite when PostgreSQL isn't available
    DATABASE_URL: str | None = None
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 5379
    

    model_config = _base_config

    @property
    def DATABASE_URI(self) -> str:
        """Return the database URL to use.
        
        If DATABASE_URL is explicitly set, use it directly.
        Otherwise construct a PostgreSQL URL from individual settings.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return str(
            URL.create(
                drivername="postgresql+psycopg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                database=self.POSTGRES_DB,
            )
        )
    @property
    def POSTGRES_URL(self):
        return f"postgresql+asyncpg://{self.POSTGRES_USER}"
    
    def REDIS_URL(self,db):
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{db}"


class SecuritySettings(BaseSettings):
    # Provide safe defaults for local development; override via .env in production
    JWT_SECRET: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20  # 20 minutes default

    model_config = _base_config
    
class NotificationSettings(BaseSettings):
    
    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_FROM:str
    MAIL_PORT:int
    MAIL_SERVER:str
    MAIL_FROM_NAME:str
    MAIL_STARTTLS:bool=True
    MAIL_SSL_TLS:bool=False
    USE_CREDENTIALS:bool=True
    VALIDATE_CERTS:bool=False
    
    TWILIO_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_NUMBER: str
    
    model_config = _base_config
    

    
settings = DatabaseSettings()

db_settings = settings
notification_settings = NotificationSettings()

security_settings = SecuritySettings()
app_settings = AppSettings()