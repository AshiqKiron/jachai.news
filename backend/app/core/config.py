from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Jachai News API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/jachai"
    cors_origins: list[str] = ["http://localhost:3000"]

    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    ai_provider: str = "groq"  # groq | gemini

    rss_fetch_timeout_seconds: float = 15.0

    # Optional — require X-Ingest-Key header on POST /api/v1/ingest
    ingest_api_key: str | None = None

    # Optional — require X-Admin-Key on GET /api/v1/admin/*
    admin_api_key: str | None = None

    # Monitoring (optional — all no-ops when unset)
    sentry_dsn: str | None = None
    sentry_environment: str = "development"
    sentry_traces_sample_rate: float = 0.0

    # Healthchecks.io ping URL for RSS ingest cron (e.g. https://hc-ping.com/<uuid>)
    healthchecks_ingest_url: str | None = None

    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    telegram_notify_ingest_success: bool = True
    telegram_alert_on_sentry_error: bool = True


settings = Settings()
