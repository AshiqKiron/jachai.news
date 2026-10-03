from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Jachai News API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/jachai"
    # Use a PgBouncer / Supavisor transaction-pool URL in production (port 6543 on Supabase).
    database_pooler_url: str | None = None
    # local = SQLAlchemy pool; pgbouncer = NullPool (pooler owns connections)
    database_pool_mode: str = "local"
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_recycle_seconds: int = 1800

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

    # Rate limiting + Celery broker (Redis recommended in production; in-memory fallback when unset)
    redis_url: str | None = None
    # Queue RSS ingest via Celery when Redis is configured (keeps API stateless under load)
    ingest_async_enabled: bool = True

    # Object storage for exports, dossiers, screenshots (optional)
    object_storage_backend: str = "none"  # none | supabase
    object_storage_bucket: str = "jachai-assets"
    object_storage_public_base_url: str | None = None
    rate_limit_enabled: bool = True
    rate_limit_default_per_minute: int = 120
    rate_limit_verify_anon_per_hour: int = 5
    rate_limit_verify_auth_per_hour: int = 30
    rate_limit_verify_pro_per_hour: int = 200
    rate_limit_ingest_per_hour: int = 20
    rate_limit_admin_per_hour: int = 60

    # Optional — validate Supabase JWT for auth-tier limits and Pro entitlement lookup
    supabase_url: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_service_role_key: str | None = None

    semantic_cache_min_similarity: float = 0.92
    verification_job_ttl_seconds: int = 86_400


    @property
    def resolved_database_url(self) -> str:
        return self.database_pooler_url or self.database_url

    @property
    def ingest_uses_queue(self) -> bool:
        return bool(self.ingest_async_enabled and self.redis_url)


settings = Settings()
