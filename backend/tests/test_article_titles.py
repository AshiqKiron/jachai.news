"""Headline ledger: keep every distinct article title, including later rewrites."""

from __future__ import annotations

import unittest

from app.services.article_titles import plan_title_store
from app.services.story_match import normalize_article_title, title_language


class TitleLanguageTests(unittest.TestCase):
    def test_bangla_english_and_mixed(self) -> None:
        self.assertEqual(title_language("পদ্মা সেতুতে ভাড়া বাড়ছে"), "bn")
        self.assertEqual(title_language("Padma toll hike proposal"), "en")
        self.assertEqual(title_language("Dhaka মেট্রোতে যাত্রী বেড়েছে"), "mixed")
        self.assertEqual(title_language("১২৩"), "bn")
        self.assertEqual(title_language("12:30"), "unknown")

    def test_normalize_collapses_whitespace_and_caps_length(self) -> None:
        self.assertEqual(normalize_article_title("  Padma   toll \n hike  "), "Padma toll hike")
        self.assertEqual(len(normalize_article_title("a" * 2500)), 2000)


class TitleStorePlanTests(unittest.TestCase):
    def test_first_headline_is_stored_once(self) -> None:
        plan = plan_title_store("পদ্মা সেতুতে ভাড়া বাড়ছে", set(), "পদ্মা সেতুতে ভাড়া বাড়ছে")
        assert plan is not None
        self.assertEqual(plan.insert_titles, ("পদ্মা সেতুতে ভাড়া বাড়ছে",))
        self.assertFalse(plan.revised)

    def test_same_wording_is_not_stored_again(self) -> None:
        plan = plan_title_store("Padma toll hike", {"Padma toll hike"}, "  Padma   toll hike ")
        assert plan is not None
        self.assertEqual(plan.insert_titles, ())
        self.assertFalse(plan.revised)
        self.assertEqual(plan.article_title, "Padma toll hike")

    def test_rewrite_keeps_the_old_wording_and_the_new_one(self) -> None:
        plan = plan_title_store("Padma toll hike proposal", set(), "Analysts split on Padma toll hike")
        assert plan is not None
        self.assertEqual(
            plan.insert_titles,
            ("Padma toll hike proposal", "Analysts split on Padma toll hike"),
        )
        self.assertTrue(plan.revised)
        self.assertEqual(plan.article_title, "Analysts split on Padma toll hike")

    def test_rewrite_does_not_repeat_a_wording_already_stored(self) -> None:
        plan = plan_title_store(
            "Padma toll hike proposal",
            {"Padma toll hike proposal"},
            "Analysts split on Padma toll hike",
        )
        assert plan is not None
        self.assertEqual(plan.insert_titles, ("Analysts split on Padma toll hike",))
        self.assertTrue(plan.revised)

    def test_blank_title_stores_nothing(self) -> None:
        self.assertIsNone(plan_title_store("Padma toll hike", set(), "   "))


if __name__ == "__main__":
    unittest.main()
