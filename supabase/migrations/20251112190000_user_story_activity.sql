-- Server-backed story follows and reading signals (replaces device-only localStorage over time).

CREATE TABLE public.story_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  cluster_slug text NOT NULL CHECK (char_length(cluster_slug) BETWEEN 1 AND 255),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT story_follows_user_slug_key UNIQUE (user_id, cluster_slug)
);

CREATE INDEX story_follows_user_id_idx ON public.story_follows (user_id);

CREATE TABLE public.story_read_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  cluster_slug text NOT NULL CHECK (char_length(cluster_slug) BETWEEN 1 AND 255),
  read_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX story_read_events_user_id_idx ON public.story_read_events (user_id, read_at DESC);
CREATE INDEX story_read_events_slug_idx ON public.story_read_events (cluster_slug, read_at DESC);

CREATE TABLE public.article_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  cluster_slug text NOT NULL CHECK (char_length(cluster_slug) BETWEEN 1 AND 255),
  article_url text NOT NULL CHECK (char_length(article_url) BETWEEN 1 AND 2048),
  source_id text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX article_click_events_user_id_idx ON public.article_click_events (user_id, clicked_at DESC);

ALTER TABLE public.story_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_read_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own story follows"
  ON public.story_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own story follows"
  ON public.story_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own story follows"
  ON public.story_follows FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own read events"
  ON public.story_read_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own read events"
  ON public.story_read_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own article clicks"
  ON public.article_click_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own article clicks"
  ON public.article_click_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
