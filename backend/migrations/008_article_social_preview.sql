-- Freeze the social preview from the first time an article is seen.
-- Later polls may change articles.title; these columns stay put.
-- correction_noted flips on only when a later pass finds a correction.

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS correction_noted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS social_preview_title TEXT;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS social_preview_description TEXT;

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS social_preview_image_url VARCHAR(2048);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS social_preview_captured_at TIMESTAMPTZ;
