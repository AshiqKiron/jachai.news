export type AdminSourceStat = {
  source_id: number;
  name: string;
  feed_url: string;
  article_count: number;
  bias_score: number | null;
  disabled: boolean;
};

export type IngestResponse = {
  sources_processed: number;
  articles_fetched: number;
  articles_created: number;
  articles_skipped_duplicate: number;
  clusters_created: number;
  clusters_updated: number;
  errors: string[];
};
