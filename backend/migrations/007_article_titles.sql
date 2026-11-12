-- Headline ledger. articles.title / clusters.title stay the current text (uncapped).
-- article_titles keeps every distinct wording, with language and a simple FTS index
-- so later features can search or compare headlines. Idempotent.

ALTER TABLE articles ALTER COLUMN title TYPE TEXT;
ALTER TABLE clusters ALTER COLUMN title TYPE TEXT;

UPDATE articles
SET title = left(regexp_replace(btrim(title), '\s+', ' ', 'g'), 2000)
WHERE title IS NOT NULL
  AND title IS DISTINCT FROM left(regexp_replace(btrim(title), '\s+', ' ', 'g'), 2000);

UPDATE clusters
SET title = left(regexp_replace(btrim(title), '\s+', ' ', 'g'), 2000)
WHERE title IS NOT NULL
  AND title IS DISTINCT FROM left(regexp_replace(btrim(title), '\s+', ' ', 'g'), 2000);

CREATE UNIQUE INDEX IF NOT EXISTS article_titles_article_id_title_md5_uidx
    ON article_titles (article_id, md5(title));

CREATE INDEX IF NOT EXISTS article_titles_language_idx ON article_titles (language);
CREATE INDEX IF NOT EXISTS article_titles_created_at_idx ON article_titles (created_at DESC);

DO $$
BEGIN
    IF to_regclass('public.article_titles') IS NULL THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'article_titles'::regclass
          AND attname = 'search_vector'
          AND NOT attisdropped
    ) THEN
        ALTER TABLE article_titles
            ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, ''))) STORED;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS article_titles_search_idx ON article_titles USING GIN (search_vector);

INSERT INTO article_titles (article_id, title, language, created_at)
SELECT
    a.id,
    a.title,
    CASE
        WHEN a.title ~ U&'[\0980-\09FF]' AND a.title ~ '[A-Za-z]' THEN 'mixed'
        WHEN a.title ~ U&'[\0980-\09FF]' THEN 'bn'
        WHEN a.title ~ '[A-Za-z]' THEN 'en'
        ELSE 'unknown'
    END,
    COALESCE(a.published_at, NOW())
FROM articles a
WHERE a.title IS NOT NULL
  AND btrim(a.title) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM article_titles t
      WHERE t.article_id = a.id AND t.title = a.title
  );
