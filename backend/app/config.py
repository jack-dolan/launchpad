from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Launchpad API"
    env: str = "development"
    secret_key: str = "change-me"
    openai_api_key: str | None = None
    token_expire_minutes: int = Field(
        default=60,
        validation_alias=AliasChoices("TOKEN_EXPIRE_MINUTES", "ACCESS_TOKEN_EXPIRE_MINUTES"),
    )
    algorithm: str = "HS256"
    database_url: str = "sqlite+aiosqlite:///./launchpad.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
