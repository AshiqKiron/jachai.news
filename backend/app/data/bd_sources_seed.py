"""Bangladeshi RSS sources for ingestion seeding.

Feed URLs below were live-verified (HTTP 200 + >=1 parseable RSS/Atom item via
``app.services.rss_parser.fetch_feed_items``) on 2026-11-12. The fetcher follows
redirects and sends a browser User-Agent, so feeds that 301/302 to a canonical
path (e.g. The Daily Star sections, Google News search) or soft-block the default
client are pulled fine.

Outlets without a server-pullable native feed (e.g. Kaler Kantho, Ittefaq, The
Financial Express, Samakal, Somoy News, Dhaka Post) are ingested through their
Google News search RSS feed instead.

Outlets that sit behind a Cloudflare JS challenge or hard bot-block (Jugantor,
Risingbd, Jagonews24 section feeds, Weekly Blitz) are intentionally omitted —
they return a challenge/"access denied" page to any server pull. Re-add them via
the admin UI (file import) if needed.

Each outlet is a single ``Source`` (unique ``name``) so blindspot / partiality /
coverage signals count one row per outlet. An outlet may expose several section
feeds: list the broadest one as ``feed_url`` and the rest under
``additional_feed_urls`` — ``app.services.rss_ingestion`` pulls them all into the
same source. Admin-managed custom sources still use a single ``feed_url``.
"""

BD_SOURCE_SEED = [
    {
        "name": "Prothom Alo",
        # /feed/ 302-redirects to /stories.rss; use the final URL directly.
        "feed_url": "https://www.prothomalo.com/stories.rss",
        "bias_score": -0.08,
        "additional_feed_urls": [
            "https://en.prothomalo.com/stories.rss",
        ],
    },
    {
        "name": "The Daily Star",
        # /frontpage/rss.xml 301-redirects to this taxonomy term; section feeds
        # also 301 to /taxonomy/term/*/rss.xml and are followed automatically.
        "feed_url": "https://www.thedailystar.net/taxonomy/term/107/rss.xml",
        "bias_score": -0.12,
        "additional_feed_urls": [
            "https://www.thedailystar.net/taxonomy/term/1/rss.xml",
            "https://www.thedailystar.net/news/bangladesh/rss.xml",
            "https://www.thedailystar.net/business/rss.xml",
            "https://www.thedailystar.net/tech-startup/rss.xml",
            "https://www.thedailystar.net/opinion/rss.xml",
            "https://www.thedailystar.net/sports/rss.xml",
        ],
    },
    {
        "name": "Dhaka Tribune",
        "feed_url": "https://www.dhakatribune.com/feed/",
        "bias_score": -0.05,
    },
    {
        "name": "The Business Standard",
        "feed_url": "https://www.tbsnews.net/rss.xml",
        "bias_score": 0.0,
        "additional_feed_urls": [
            "https://www.tbsnews.net/economy/rss.xml",
        ],
    },
    {
        "name": "The Daily Observer",
        "feed_url": "https://www.observerbd.com/rss.php",
        "bias_score": 0.1,
    },
    {
        "name": "Ajker Patrika",
        "feed_url": "https://www.ajkerpatrika.com/feed",
        "bias_score": 0.0,
    },
    {
        "name": "Jagonews24",
        # Only the main feed is open; section feeds sit behind Cloudflare.
        "feed_url": "https://www.jagonews24.com/rss/rss.xml",
        "bias_score": 0.0,
    },
    {
        "name": "Bangla Tribune",
        "feed_url": "https://www.banglatribune.com/feed/",
        "bias_score": 0.0,
    },
    {
        "name": "Bangladesh Journal",
        "feed_url": "https://www.bd-journal.com/feed/latest-rss.xml",
        "bias_score": 0.0,
    },
    {
        "name": "Bangladesh Diplomat",
        "feed_url": "https://bangladeshdiplomat.com/feed/",
        "bias_score": 0.0,
    },
    {
        "name": "Energy Bangla",
        "feed_url": "https://energybangla.com/feed/",
        "bias_score": 0.0,
        "additional_feed_urls": [
            "https://energybangla.com.bd/feed/",
        ],
    },
    {
        "name": "BD24Live",
        "feed_url": "https://www.bd24live.com/bangla/feed",
        "bias_score": 0.0,
    },
    {
        "name": "Channel i Online",
        "feed_url": "https://www.channelionline.com/rss.xml",
        "bias_score": 0.0,
    },
    {
        "name": "The New Nation",
        "feed_url": "https://www.newnationbd.com/feed/",
        "bias_score": 0.0,
    },
    {
        "name": "Kaler Kantho",
        # No server-pullable native feed; use Google News search RSS.
        "feed_url": "https://news.google.com/rss/search?q=site:kalerkantho.com&hl=en-US&gl=US&ceid=US:en",
        "bias_score": 0.0,
    },
    {
        "name": "The Daily Ittefaq",
        "feed_url": "https://news.google.com/rss/search?q=site:ittefaq.com.bd",
        "bias_score": 0.0,
    },
    {
        "name": "The Financial Express",
        "feed_url": "https://news.google.com/rss/search?q=site:thefinancialexpress.com.bd",
        "bias_score": 0.0,
    },
    {
        "name": "Samakal",
        "feed_url": "https://news.google.com/rss/search?q=site:samakal.com",
        "bias_score": 0.0,
    },
    {
        "name": "Somoy News",
        "feed_url": "https://news.google.com/rss/search?q=site:somoynews.tv",
        "bias_score": 0.0,
    },
    {
        "name": "Dhaka Post",
        "feed_url": "https://news.google.com/rss/search?q=site:dhakapost.com&hl=en-US&gl=US&ceid=US:en",
        "bias_score": 0.0,
    },
    {
        "name": "BBC Bangla",
        "feed_url": "https://feeds.bbci.co.uk/bengali/rss.xml",
        "bias_score": 0.0,
    },
]
