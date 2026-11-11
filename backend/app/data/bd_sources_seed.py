"""Bangladeshi RSS sources for ingestion seeding.

Feed URLs below were live-verified (HTTP 200 + >=1 parseable RSS/Atom item via
``app.services.rss_parser.fetch_feed_items``) on 2026-11-12. The fetcher follows
redirects and sends a browser User-Agent, so feeds that 301/302 to a canonical
path (e.g. The Daily Star sections, Google News search) or soft-block the default
client are pulled fine.

Outlets without a server-pullable native feed (e.g. Kaler Kantho, Ittefaq, The
Financial Express, Samakal, Somoy News, Dhaka Post) are ingested through their
Google News search RSS feed instead.

Jugantor, Risingbd, and Weekly Blitz still return a Cloudflare/JS challenge to
server pulls. They are seeded with ``ingest_mode`` ``file`` so ownership is stored
and scheduled RSS skips them. Jagonews24 section feeds stay off the pull list;
only the open main feed is fetched.

Each outlet is a single ``Source`` (unique ``name``). Section feeds go in
``additional_feed_urls``. ``owner_name`` / ``owner_url`` is the operating company
or named publisher; ``parent_name`` / ``parent_url`` is the group when distinct.
``ensure_sources_seeded`` writes those columns.
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
        "owner_name": "Mediastar Limited",
        "owner_url": "https://www.transcombd.com/businesses/media/mediastar/",
        "parent_name": "Transcom Group",
        "parent_url": "https://www.transcombd.com/",
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
        "owner_name": "Mediaworld Limited",
        "owner_url": "https://www.thedailystar.net/about-us",
        "parent_name": "Transcom Group",
        "parent_url": "https://www.transcombd.com/",
    },
    {
        "name": "Dhaka Tribune",
        "feed_url": "https://www.dhakatribune.com/feed/",
        "bias_score": -0.05,
        "owner_name": "2A Media Limited",
        "owner_url": "https://www.dhakatribune.com/",
        "parent_name": "Gemcon Group",
        "parent_url": "https://gemcongroup.com/",
    },
    {
        "name": "The Business Standard",
        "feed_url": "https://www.tbsnews.net/rss.xml",
        "bias_score": 0.0,
        "additional_feed_urls": [
            "https://www.tbsnews.net/economy/rss.xml",
        ],
        "owner_name": "The Horizon Media and Publication Ltd.",
        "owner_url": "https://www.tbsnews.net/about-us",
        "parent_name": "Orion Group",
        "parent_url": "https://www.orion-group.net/",
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
        "owner_name": "Bijoy Bangla Media Limited",
        "owner_url": "https://www.ajkerpatrika.com/about-us",
        "parent_name": "US-Bangla Group",
        "parent_url": "https://www.usbassets.com/about/us-bangla-group/",
    },
    {
        "name": "Jagonews24",
        # Only the main feed is open; section feeds sit behind Cloudflare.
        "feed_url": "https://www.jagonews24.com/rss/rss.xml",
        "bias_score": 0.0,
        "owner_name": "AKC (Pvt.) Ltd.",
        "owner_url": "https://www.jagonews24.com/",
    },
    {
        "name": "Bangla Tribune",
        "feed_url": "https://www.banglatribune.com/feed/",
        "bias_score": 0.0,
        "owner_name": "2A Media Limited",
        "owner_url": "https://www.banglatribune.com/",
        "parent_name": "Gemcon Group",
        "parent_url": "https://gemcongroup.com/",
    },
    {
        "name": "Bangladesh Journal",
        "feed_url": "https://www.bd-journal.com/feed/latest-rss.xml",
        "bias_score": 0.0,
        "owner_name": "Anwar Hossain Khan",
        "owner_url": "https://www.bd-journal.com/",
    },
    {
        "name": "Bangladesh Diplomat",
        "feed_url": "https://bangladeshdiplomat.com/feed/",
        "bias_score": 0.0,
        "owner_name": "Monjurul Islam Joy",
        "owner_url": "https://bangladeshdiplomat.com/about-us/",
    },
    {
        "name": "Energy Bangla",
        "feed_url": "https://energybangla.com/feed/",
        "bias_score": 0.0,
        "additional_feed_urls": [
            "https://energybangla.com.bd/feed/",
        ],
        "owner_name": "Energy Bangla Limited",
        "owner_url": "https://energybangla.com/",
    },
    {
        "name": "BD24Live",
        "feed_url": "https://www.bd24live.com/bangla/feed",
        "bias_score": 0.0,
        "owner_name": "BD24Live Media (Pvt.) Ltd.",
        "owner_url": "https://www.bd24live.com/",
    },
    {
        "name": "Channel i Online",
        "feed_url": "https://www.channelionline.com/rss.xml",
        "bias_score": 0.0,
        "owner_name": "Impress Group",
        "owner_url": "https://www.impress-group.org/",
    },
    {
        "name": "The New Nation",
        "feed_url": "https://www.newnationbd.com/feed/",
        "bias_score": 0.0,
        "owner_name": "Ittefaq Group of Publications Ltd.",
        "owner_url": "https://www.ittefaq.com.bd/",
    },
    {
        "name": "Kaler Kantho",
        # No server-pullable native feed; use Google News search RSS.
        "feed_url": "https://news.google.com/rss/search?q=site:kalerkantho.com&hl=en-US&gl=US&ceid=US:en",
        "bias_score": 0.0,
        "owner_name": "East West Media Group PLC",
        "owner_url": "https://ewmgl.com/",
        "parent_name": "Bashundhara Group",
        "parent_url": "https://www.bashundharagroup.com/",
    },
    {
        "name": "The Daily Ittefaq",
        "feed_url": "https://news.google.com/rss/search?q=site:ittefaq.com.bd",
        "bias_score": 0.0,
        "owner_name": "Ittefaq Group of Publications Ltd.",
        "owner_url": "https://www.ittefaq.com.bd/",
    },
    {
        "name": "The Financial Express",
        "feed_url": "https://news.google.com/rss/search?q=site:thefinancialexpress.com.bd",
        "bias_score": 0.0,
        "owner_name": "International Publications Limited",
        "owner_url": "https://thefinancialexpress.com.bd/",
    },
    {
        "name": "Samakal",
        "feed_url": "https://news.google.com/rss/search?q=site:samakal.com",
        "bias_score": 0.0,
        "owner_name": "Times Media Ltd.",
        "owner_url": "https://samakal.com/",
        "parent_name": "Ha-Meem Group",
        "parent_url": "https://www.hameemgroup.net/",
    },
    {
        "name": "Somoy News",
        "feed_url": "https://news.google.com/rss/search?q=site:somoynews.tv",
        "bias_score": 0.0,
        "owner_name": "Somoy Media Limited",
        "owner_url": "https://www.somoynews.tv/",
        "parent_name": "City Group",
        "parent_url": "https://www.citygroup.com.bd/",
    },
    {
        "name": "Dhaka Post",
        "feed_url": "https://news.google.com/rss/search?q=site:dhakapost.com&hl=en-US&gl=US&ceid=US:en",
        "bias_score": 0.0,
        "owner_name": "Bijoy Bangla Media Limited",
        "owner_url": "https://www.dhakapost.com/about-us",
        "parent_name": "US-Bangla Group",
        "parent_url": "https://www.usbassets.com/about/us-bangla-group/",
    },
    {
        "name": "BBC Bangla",
        "feed_url": "https://feeds.bbci.co.uk/bengali/rss.xml",
        "bias_score": 0.0,
        "owner_name": "BBC World Service",
        "owner_url": "https://www.bbc.com/bengali",
        "parent_name": "British Broadcasting Corporation (BBC)",
        "parent_url": "https://www.bbc.co.uk/aboutthebbc",
    },
    {
        "name": "Jugantor",
        # Server pull is bot-blocked; keep the feed URL and skip live RSS.
        "feed_url": "https://www.jugantor.com/feed/rss.xml",
        "bias_score": 0.0,
        "ingest_mode": "file",
        "owner_name": "Jamuna Printing and Publishing Ltd.",
        "owner_url": "https://jamunagroup.com.bd/companies/21/THE-DAILY-JUGANTOR",
        "parent_name": "Jamuna Group",
        "parent_url": "https://jamunagroup.com.bd/",
    },
    {
        "name": "Risingbd",
        "feed_url": "https://www.risingbd.com/rss/rss.xml",
        "bias_score": 0.0,
        "ingest_mode": "file",
        "owner_name": "Skyroute Media Limited",
        "owner_url": "https://www.risingbd.com/",
    },
    {
        "name": "Weekly Blitz",
        "feed_url": "https://weeklyblitz.net/feed/",
        "bias_score": 0.0,
        "ingest_mode": "file",
        "owner_name": "Salah Uddin Shoaib Choudhury",
        "owner_url": "https://weeklyblitz.net/about-us/",
    },
    {
        "name": "Sangbad Pratidin",
        "feed_url": "https://www.sangbadpratidin.in/feed/",
        "bias_score": 0.0,
        "owner_name": "Pratidin Prakashani Pvt. Ltd.",
        "owner_url": "https://www.sangbadpratidin.in/about-us/",
    },
]
