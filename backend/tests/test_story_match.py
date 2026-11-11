"""Cross-language story matching. Same event joins; a different angle does not."""

from __future__ import annotations

import unittest

from app.services.story_match import cross_lingual_score, prefer_bangla_title

_MATCH = 0.42


def _joins(a: str, b: str) -> bool:
    return cross_lingual_score(a, b) >= _MATCH


class StoryMatchTests(unittest.TestCase):
    def test_padma_toll_joins_across_languages(self) -> None:
        self.assertTrue(
            _joins(
                "Analysts split on timing of Padma toll hike proposal",
                "পদ্মা সেতুতে ভাড়া বাড়ানোর সিদ্ধান্ত জনকল্যাণমুখী",
            )
        )

    def test_padma_accident_stays_separate_from_toll(self) -> None:
        self.assertFalse(
            _joins(
                "Padma Bridge accident kills two",
                "পদ্মা সেতুতে ভাড়া বাড়ানোর প্রস্তাব",
            )
        )

    def test_women_asia_cup_final_joins(self) -> None:
        self.assertTrue(
            _joins(
                "Bangladesh women reach the Asia Cup final",
                "এশিয়া কাপের ফাইনালে বাংলাদেশ নারী দল",
            )
        )

    def test_asia_cup_final_does_not_join_semifinal(self) -> None:
        self.assertFalse(
            _joins(
                "Bangladesh women reach the Asia Cup final",
                "Tigers reach Asia Cup semifinal after tense chase",
            )
        )

    def test_buriganga_joins(self) -> None:
        self.assertTrue(
            _joins(
                "Unconfirmed posts say the Buriganga cleanup will stop next week",
                "বুড়িগঙ্গায় এক সপ্তাহে তোলা প্লাস্টিকের হিসাব প্রকাশ",
            )
        )

    def test_saint_martins_coral_joins(self) -> None:
        self.assertTrue(
            _joins(
                "Saint Martin's survey finds a small rise in coral cover",
                "সেন্ট মার্টিনে প্রবালের আচ্ছাদন সামান্য বেড়েছে",
            )
        )

    def test_saff_joins_and_cleanup_word_does_not(self) -> None:
        self.assertTrue(
            _joins(
                "Late strike sends Bangladesh top of the SAFF group",
                "চাঞ্চল্যকর! সাফে বাংলাদেশের জয় নিয়ে যা কেউ ভাবেনি",
            )
        )
        self.assertFalse(_joins("SAFF group standings", "নদীর সাফাই কাজ শেষ"))

    def test_sundarbans_tigers_join_and_fire_does_not(self) -> None:
        self.assertTrue(
            _joins(
                "Latest Sundarbans survey counts more tigers than the last census",
                "সুন্দরবনে বাঘ বেড়েছে— জরিপ কীভাবে হলো",
            )
        )
        self.assertFalse(_joins("Fire spreads in the Sundarbans", "সুন্দরবনে বাঘ বেড়েছে"))

    def test_dhaka_metro_joins(self) -> None:
        self.assertTrue(
            _joins(
                "Weekend crowds pack the new Dhaka metro extension",
                "ছুটির দিনে নতুন মেট্রো অংশে যাত্রী বেড়েছে",
            )
        )

    def test_election_schedule_joins(self) -> None:
        self.assertTrue(
            _joins(
                "EC notice confirms schedule review; parties wait on a date",
                "সুষ্ঠু ভোটের স্বার্থে সময়সূচি পর্যালোচনা করছে কমিশন",
            )
        )

    def test_dhaka_air_joins_and_metro_does_not(self) -> None:
        bangla = "ঢাকার বায়ু দূষণ বেড়েছে; বিদ্যালয়গুলোতে বাইরের কার্যক্রম নিয়ে আলোচনা"
        self.assertTrue(_joins("Dhaka air quality worsens; schools debate outdoor activities", bangla))
        self.assertFalse(_joins("ছুটির দিনে নতুন মেট্রো অংশে যাত্রী বেড়েছে", bangla))

    def test_remittance_joins(self) -> None:
        self.assertTrue(
            _joins(
                "September remittance inflow hits multi-year high",
                "সেপ্টেম্বরে রেমিট্যান্স ২.১ বিলিয়ন ডলার ছাড়াল",
            )
        )

    def test_dhaka_derby_joins(self) -> None:
        self.assertTrue(
            _joins(
                "Abahani take the Dhaka derby by a single goal",
                "আবাহনী–মোহামেডানের ডার্বিতে জয় আবাহনীর",
            )
        )

    def test_unrelated_headlines_do_not_join(self) -> None:
        self.assertEqual(
            cross_lingual_score(
                "Remittance surge cushions import bill pressure",
                "Weekend crowds pack the new Dhaka metro extension",
            ),
            0.0,
        )

    def test_prefer_bangla_title_keeps_the_first_bangla_headline(self) -> None:
        self.assertEqual(
            prefer_bangla_title("Padma toll hike proposal", "পদ্মা সেতুতে ভাড়া বাড়ছে"),
            "পদ্মা সেতুতে ভাড়া বাড়ছে",
        )
        self.assertEqual(
            prefer_bangla_title("পদ্মা সেতুতে ভাড়া বাড়ছে", "আরেকটি বাংলা শিরোনাম"),
            "পদ্মা সেতুতে ভাড়া বাড়ছে",
        )
        self.assertEqual(
            prefer_bangla_title("Padma toll hike proposal", "Analysts split on the toll"),
            "Padma toll hike proposal",
        )


if __name__ == "__main__":
    unittest.main()
