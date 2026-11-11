/** Built-in RSS outlets from `backend/app/data/bd_sources_seed.py` (not home “custom” feeds). */
export const SEED_SOURCE_NAMES = new Set([
  "Prothom Alo",
  "The Daily Star",
  "Dhaka Tribune",
  "The Business Standard",
  "The Daily Observer",
  "Ajker Patrika",
  "Jagonews24",
  "Bangla Tribune",
  "Bangladesh Journal",
  "Bangladesh Diplomat",
  "Energy Bangla",
  "BD24Live",
  "Channel i Online",
  "The New Nation",
  "Kaler Kantho",
  "The Daily Ittefaq",
  "The Financial Express",
  "Samakal",
  "Somoy News",
  "Dhaka Post",
  "BBC Bangla",
]);

export function isCustomRssSource(name: string): boolean {
  return !SEED_SOURCE_NAMES.has(name);
}
