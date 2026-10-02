export type IngestResponse = {
  sources_processed: number;
  articles_fetched: number;
  articles_created: number;
  articles_skipped_duplicate: number;
  clusters_created: number;
  clusters_updated: number;
  errors: string[];
};
