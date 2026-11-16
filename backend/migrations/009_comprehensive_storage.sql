-- Rich article/cluster/source storage for product features and future search/alerts.

-- ---------------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------------
ALTER TABLE sources
    ADD COLUMN IF NOT EXISTS homepage_url VARCHAR(2048);

ALTER TABLE sources
    ADD COLUMN IF NOT EXISTS language VARCHAR(8) NOT NULL DEFAULT 'bn';

ALTER TABLE sources
    ADD COLUMN IF NOT EXISTS factuality VARCHAR(32);

ALTER TABLE sources
    ADD COLUMN IF NOT EXISTS additional_feed_urls TEXT[] NOT NULL DEFAULT '{}'::text[];

-- ---------------------------------------------------------------------------
-- Clusters
-- ---------------------------------------------------------------------------
ALTER TABLE clusters
    ADD COLUMN IF NOT EXISTS topic_id VARCHAR(32) NOT NULL DEFAULT 'news';

ALTER TABLE clusters
    ADD COLUMN IF NOT EXISTS category VARCHAR(64);

ALTER TABLE clusters
    ADD COLUMN IF NOT EXISTS category_bn VARCHAR(64);

ALTER TABLE clusters
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE clusters
    ADD COLUMN IF NOT EXISTS last_article_at TIMESTAMPTZ;

DO $$
BEGIN
    IF to_regclass('public.clusters') IS NULL THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'clusters'::regclass
          AND attname = 'embedding'
          AND NOT attisdropped
    ) THEN
        CREATE EXTENSION IF NOT EXISTS vector;
        ALTER TABLE clusters ADD COLUMN embedding vector(768);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS clusters_topic_id_idx ON clusters (topic_id);
CREATE INDEX IF NOT EXISTS clusters_last_article_at_idx ON clusters (last_article_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------
ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS rss_guid VARCHAR(512);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS author VARCHAR(512);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS section VARCHAR(255);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS body_text TEXT;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS perspective VARCHAR(32);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS rumor_flag_reason VARCHAR(64);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS rumor_marked_at TIMESTAMPTZ;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS last_ingested_at TIMESTAMPTZ;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS availability_status VARCHAR(16) NOT NULL DEFAULT 'unknown';

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS last_availability_check TIMESTAMPTZ;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS removed_headline TEXT;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS removed_excerpt TEXT;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS archive_snapshot_url VARCHAR(2048);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS ingest_feed_url VARCHAR(2048);

UPDATE articles
SET first_seen_at = COALESCE(published_at, NOW())
WHERE first_seen_at IS NULL;

UPDATE articles
SET availability_status = 'ok'
WHERE availability_status = 'unknown'
  AND removed_at IS NULL;

CREATE INDEX IF NOT EXISTS articles_rss_guid_idx ON articles (rss_guid) WHERE rss_guid IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_removed_at_idx ON articles (removed_at DESC NULLS LAST) WHERE removed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_perspective_idx ON articles (perspective) WHERE perspective IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_last_ingested_at_idx ON articles (last_ingested_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- Excerpt ledger (mirror article_titles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_excerpts (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    excerpt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT article_excerpts_excerpt_nonempty_chk CHECK (btrim(excerpt) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS article_excerpts_article_id_md5_uidx
    ON article_excerpts (article_id, md5(excerpt));

CREATE INDEX IF NOT EXISTS article_excerpts_created_at_idx ON article_excerpts (created_at DESC);

INSERT INTO article_excerpts (article_id, excerpt, created_at)
SELECT a.id, a.excerpt, COALESCE(a.published_at, a.first_seen_at, NOW())
FROM articles a
WHERE a.excerpt IS NOT NULL
  AND btrim(a.excerpt) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM article_excerpts e
      WHERE e.article_id = a.id AND e.excerpt = a.excerpt
  );

-- ---------------------------------------------------------------------------
-- Cluster merge/split audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cluster_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL,
    keeper_cluster_id INTEGER NOT NULL REFERENCES clusters (id) ON DELETE CASCADE,
    other_cluster_id INTEGER REFERENCES clusters (id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cluster_events_type_chk CHECK (event_type IN ('merge', 'split'))
);

CREATE INDEX IF NOT EXISTS cluster_events_keeper_idx ON cluster_events (keeper_cluster_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Verified claims ↔ news graph
-- ---------------------------------------------------------------------------
ALTER TABLE verified_claims
    ADD COLUMN IF NOT EXISTS cluster_id INTEGER REFERENCES clusters (id) ON DELETE SET NULL;

ALTER TABLE verified_claims
    ADD COLUMN IF NOT EXISTS article_id INTEGER REFERENCES articles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS verified_claims_cluster_id_idx ON verified_claims (cluster_id) WHERE cluster_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS verified_claims_article_id_idx ON verified_claims (article_id) WHERE article_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Durable verification jobs (Redis remains hot cache)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_jobs (
    job_id UUID PRIMARY KEY,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    slug VARCHAR(160),
    message TEXT NOT NULL DEFAULT 'Queued',
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    claim_text TEXT NOT NULL,
    source_url VARCHAR(2048),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_jobs_status_idx ON verification_jobs (status, created_at DESC);
