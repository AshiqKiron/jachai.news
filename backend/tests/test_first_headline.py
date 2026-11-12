"""First headline stays put when a later poll softens the wording."""

from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from app.services.article_titles import snapshot_headline
from app.services.social_preview import freeze_social_preview, parse_social_preview, text_notes_correction


class HeadlineSnapshotTests(unittest.TestCase):
    def test_softened_headline_keeps_the_first_line_and_the_clock(self) -> None:
        seen = datetime(2026, 11, 12, 3, 20, tzinfo=timezone.utc)
        edited = seen + timedelta(minutes=40)
        snap = snapshot_headline(
            "একজন বিএনপি নেতাকে নিয়ে গুঞ্জন",
            [
                ("একজন বিএনপি নেতাকে গ্রেপ্তার", seen),
                ("একজন বিএনপি নেতাকে নিয়ে গুঞ্জন", edited),
            ],
        )
        self.assertEqual(snap.original_title, "একজন বিএনপি নেতাকে গ্রেপ্তার")
        self.assertEqual(snap.original_seen_at, seen)
        self.assertEqual(snap.headline_edited_at, edited)

    def test_unchanged_headline_has_no_edit_time(self) -> None:
        seen = datetime(2026, 11, 12, 3, 20, tzinfo=timezone.utc)
        snap = snapshot_headline("একজন বিএনপি নেতাকে গ্রেপ্তার", [("একজন বিএনপি নেতাকে গ্রেপ্তার", seen)])
        self.assertIsNone(snap.headline_edited_at)
        self.assertEqual(snap.original_title, "একজন বিএনপি নেতাকে গ্রেপ্তার")


class SocialPreviewTests(unittest.TestCase):
    def test_og_title_wins_whichever_attribute_comes_first(self) -> None:
        html = (
            '<meta content="একজন বিএনপি নেতাকে গ্রেপ্তার" property="og:title">'
            '<meta property="og:image" content="https://images.example/arrest.jpg">'
        )
        parsed = parse_social_preview(html)
        self.assertEqual(parsed.title, "একজন বিএনপি নেতাকে গ্রেপ্তার")
        self.assertEqual(parsed.image_url, "https://images.example/arrest.jpg")

    def test_freeze_keeps_the_first_share_title(self) -> None:
        html = '<meta property="og:title" content="একজন বিএনপি নেতাকে গ্রেপ্তার">'
        frozen = freeze_social_preview(
            headline="একজন বিএনপি নেতাকে নিয়ে গুঞ্জন",
            excerpt=None,
            rss_image_url=None,
            html=html,
        )
        self.assertEqual(frozen.title, "একজন বিএনপি নেতাকে গ্রেপ্তার")

    def test_softened_page_without_a_correction_is_not_a_correction(self) -> None:
        self.assertFalse(text_notes_correction("একজন বিএনপি নেতাকে নিয়ে গুঞ্জন"))
        self.assertTrue(text_notes_correction("সংশোধনী: গ্রেপ্তারের খবরটি ভুল ছিল।"))


if __name__ == "__main__":
    unittest.main()
