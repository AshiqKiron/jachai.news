/** Built-in RSS outlets from `backend/app/data/bd_sources_seed.py` (not home “custom” feeds). */
export const SEED_SOURCE_NAMES = new Set([
  "Prothom Alo",
  "The Daily Star",
  "bdnews24.com",
  "Jugantor",
  "Samakal",
  "BBC Bangla",
  "The Financial Express",
]);

export function isCustomRssSource(name: string): boolean {
  return !SEED_SOURCE_NAMES.has(name);
}
