-- rss: pull from feed_url | file: admin file uploads until switched to live RSS
ALTER TABLE sources ADD COLUMN IF NOT EXISTS ingest_mode VARCHAR(16) NOT NULL DEFAULT 'rss';
