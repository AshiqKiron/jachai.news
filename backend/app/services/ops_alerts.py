"""Healthchecks.io pings, Telegram ops alerts — optional via env (zero cost when unset)."""

from __future__ import annotations

import logging
from typing import Literal

import httpx

from app.core.config import settings
from app.services.rss_ingestion import IngestResult

logger = logging.getLogger(__name__)

HealthcheckSignal = Literal["start", "success", "fail"]

_TELEGRAM_MAX_LEN = 4096


def _healthcheck_suffix(signal: HealthcheckSignal) -> str:
    if signal == "start":
        return "/start"
    if signal == "fail":
        return "/fail"
    return ""


async def ping_healthcheck(signal: HealthcheckSignal = "success") -> None:
    """Ping Healthchecks.io (GET). No-op when HEALTHCHECKS_INGEST_URL is unset."""
    base = settings.healthchecks_ingest_url
    if not base:
        return
    url = base.rstrip("/") + _healthcheck_suffix(signal)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Healthcheck ping failed (%s): %s", signal, exc)


def send_telegram_message(text: str) -> bool:
    """Post to a Telegram chat via Bot API. Returns True if sent."""
    token = settings.telegram_bot_token
    chat_id = settings.telegram_chat_id
    if not token or not chat_id:
        return False
    body = text.strip()
    if len(body) > _TELEGRAM_MAX_LEN:
        body = body[: _TELEGRAM_MAX_LEN - 1] + "…"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json={"chat_id": chat_id, "text": body})
            response.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("Telegram alert failed: %s", exc)
        return False


async def send_telegram_message_async(text: str) -> bool:
    token = settings.telegram_bot_token
    chat_id = settings.telegram_chat_id
    if not token or not chat_id:
        return False
    body = text.strip()
    if len(body) > _TELEGRAM_MAX_LEN:
        body = body[: _TELEGRAM_MAX_LEN - 1] + "…"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json={"chat_id": chat_id, "text": body})
            response.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("Telegram alert failed: %s", exc)
        return False


def _format_ingest_summary(result: IngestResult, *, channel: str) -> str:
    err_note = f" | feed errors: {len(result.errors)}" if result.errors else ""
    return (
        f"RSS ingest ({channel})\n"
        f"Sources: {result.sources_processed} | fetched: {result.articles_fetched} | "
        f"created: {result.articles_created} | dup skipped: {result.articles_skipped_duplicate} | "
        f"clusters +{result.clusters_created} ~{result.clusters_updated}{err_note}"
    )


async def notify_ingest_finished(result: IngestResult, *, channel: str = "api") -> None:
    """Success ping to Healthchecks + optional Telegram summary after a completed run."""
    await ping_healthcheck("success")
    if settings.telegram_notify_ingest_success:
        prefix = "✅" if not result.errors else "⚠️"
        await send_telegram_message_async(f"{prefix} {_format_ingest_summary(result, channel=channel)}")


async def notify_ingest_failed(exc: BaseException, *, channel: str = "api") -> None:
    await ping_healthcheck("fail")
    await send_telegram_message_async(f"🚨 RSS ingest crashed ({channel}): {type(exc).__name__}: {exc}")


async def notify_ingest_started(*, channel: str = "cli") -> None:
    _ = channel
    await ping_healthcheck("start")


def notify_payment_webhook(*, success: bool, detail: str, provider: str = "payeurasia") -> bool:
    """Call from PayEurasia (or other) webhook handlers when checkout is wired."""
    icon = "✅" if success else "❌"
    return send_telegram_message(f"{icon} {provider} webhook: {detail}")
