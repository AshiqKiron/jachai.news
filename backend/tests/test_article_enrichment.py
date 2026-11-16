from app.services.article_enrichment import assess_rumor_coverage, infer_story_topic


def test_assess_rumor_bengali_keyword() -> None:
    assessment = assess_rumor_coverage("শিরোনাম", "সূত্র বলছে কিছু ঘটেছে")
    assert assessment.is_rumor is True
    assert assessment.reason == "keyword"


def test_infer_story_topic_sports_from_feed_url() -> None:
    guess = infer_story_topic(
        title="টিম জিতেছে",
        section=None,
        tags=(),
        feed_url="https://www.thedailystar.net/sports/rss.xml",
    )
    assert guess.topic_id == "sports"
    assert guess.category == "Sports"
