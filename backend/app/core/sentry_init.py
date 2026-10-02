"""Optional Sentry SDK init + Telegram hook for fatal/error events."""

from __future__ import annotations

import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.types import Event, Hint

from app.core.config import settings
from app.services.ops_alerts import send_telegram_message

logger = logging.getLogger(__name__)


def _telegram_from_sentry_event(event: Event, hint: Hint) -> None:
    if not settings.telegram_alert_on_sentry_error:
        return
    level = event.get("level")
    if level not in ("error", "fatal"):
        return
    title = event.get("transaction") or event.get("logger") or settings.app_name
    message = event.get("message") or event.get("logentry", {}).get("message") or "Unhandled error"
    exc_info = hint.get("exc_info")
    exc_line = ""
    if exc_info and exc_info[1]:
        exc_line = f"\n{type(exc_info[1]).__name__}: {exc_info[1]}"
    send_telegram_message(f"🚨 Sentry ({level}) — {title}\n{message}{exc_line}")


def _before_send(event: Event, hint: Hint) -> Event | None:
    try:
        _telegram_from_sentry_event(event, hint)
    except Exception as exc:
        logger.warning("Sentry before_send telegram hook failed: %s", exc)
    return event


def init_sentry() -> None:
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,
        before_send=_before_send,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
    )
