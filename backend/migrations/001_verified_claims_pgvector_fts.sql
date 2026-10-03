-- pgvector + FTS for verified_claims (ORM creates base table on startup).

CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
    IF to_regclass('public.verified_claims') IS NULL THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'verified_claims'::regclass AND attname = 'embedding'
    ) THEN
        ALTER TABLE verified_claims ADD COLUMN embedding vector(768);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'verified_claims'::regclass AND attname = 'search_vector'
    ) THEN
        ALTER TABLE verified_claims
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(claim_text, '')), 'A')
            || setweight(to_tsvector('english', coalesce(tags, '')), 'B')
        ) STORED;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS verified_claims_search_idx ON verified_claims USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS verified_claims_embedding_hnsw_idx
    ON verified_claims
    USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL AND status = 'completed';
