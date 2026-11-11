-- Publisher and corporate parent for each outlet. Nullable so custom feeds can omit them.
ALTER TABLE sources ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE sources ADD COLUMN IF NOT EXISTS owner_url VARCHAR(2048);
ALTER TABLE sources ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
ALTER TABLE sources ADD COLUMN IF NOT EXISTS parent_url VARCHAR(2048);
