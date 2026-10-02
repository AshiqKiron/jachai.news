"""Bangladeshi RSS sources for ingestion seeding."""

BD_SOURCE_SEED = [
    {
        "name": "Prothom Alo",
        "feed_url": "https://www.prothomalo.com/api/v1/collections/home.rss",
        "bias_score": -0.08,
    },
    {
        "name": "The Daily Star",
        "feed_url": "https://www.thedailystar.net/feeds/rss",
        "bias_score": -0.12,
    },
    {
        "name": "bdnews24.com",
        "feed_url": "https://bdnews24.com/?widgetName=rssfeed&widgetId=1150&getXmlFeed=true",
        "bias_score": 0.02,
    },
    {
        "name": "Jugantor",
        "feed_url": "https://www.jugantor.com/rss.xml",
        "bias_score": 0.42,
    },
    {
        "name": "Samakal",
        "feed_url": "https://samakal.com/rss.xml",
        "bias_score": -0.38,
    },
    {
        "name": "BBC Bangla",
        "feed_url": "https://feeds.bbci.co.uk/bengali/rss.xml",
        "bias_score": 0.0,
    },
    {
        "name": "The Financial Express",
        "feed_url": "https://thefinancialexpress.com.bd/feed",
        "bias_score": 0.28,
    },
]
