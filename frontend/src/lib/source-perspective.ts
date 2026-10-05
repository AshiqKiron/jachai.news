import { BD_SOURCES, type NewsSource } from "@/lib/demo-data";
import { biasScoreToPerspective, type Perspective } from "@/lib/perspectives";
import type { SourceBias } from "@/lib/api";

/** Outlets treated as international regardless of near-zero bias score. */
const INTERNATIONAL_SOURCE_NAMES = new Set([
  "BBC Bangla",
  "DW Bangla",
  "Al Jazeera Bangla",
  "Voice of America Bangla",
]);

const SOURCE_BY_NAME = new Map(BD_SOURCES.map((s) => [s.name.toLowerCase(), s]));
const SOURCE_BY_ID = new Map(BD_SOURCES.map((s) => [s.id, s]));

export type SourcePerspectiveLookup = {
  bySourceId: Map<string, Perspective>;
  bySourceName: Map<string, Perspective>;
};

export function perspectiveForKnownSource(source: NewsSource): Perspective {
  return source.perspective;
}

export function perspectiveFromNameAndBias(
  sourceName: string | null | undefined,
  biasScore: number | null | undefined,
): Perspective {
  if (sourceName && INTERNATIONAL_SOURCE_NAMES.has(sourceName)) {
    return "international";
  }
  if (sourceName) {
    const known = SOURCE_BY_NAME.get(sourceName.toLowerCase());
    if (known) return known.perspective;
  }
  if (biasScore !== null && biasScore !== undefined) {
    return biasScoreToPerspective(biasScore);
  }
  return "neutral";
}

export function buildSourcePerspectiveLookup(sources: SourceBias[]): SourcePerspectiveLookup {
  const bySourceId = new Map<string, Perspective>();
  const bySourceName = new Map<string, Perspective>();
  for (const row of sources) {
    const perspective = perspectiveFromNameAndBias(row.name, row.bias_score);
    bySourceId.set(String(row.source_id), perspective);
    bySourceName.set(row.name, perspective);
  }
  return { bySourceId, bySourceName };
}

export function resolveSourceById(sourceId: string): NewsSource | undefined {
  return SOURCE_BY_ID.get(sourceId);
}

export function resolveArticlePerspective(
  sourceId: string,
  overrides?: { perspective?: Perspective; sourceName?: string; biasScore?: number | null },
  lookup?: SourcePerspectiveLookup,
): Perspective {
  if (overrides?.perspective) return overrides.perspective;
  const known = resolveSourceById(sourceId);
  if (known) return known.perspective;
  if (overrides?.sourceName) {
    if (lookup?.bySourceName.has(overrides.sourceName)) {
      return lookup.bySourceName.get(overrides.sourceName)!;
    }
    return perspectiveFromNameAndBias(overrides.sourceName, overrides.biasScore);
  }
  if (lookup?.bySourceId.has(sourceId)) {
    return lookup.bySourceId.get(sourceId)!;
  }
  if (overrides?.biasScore !== undefined && overrides?.biasScore !== null) {
    return biasScoreToPerspective(overrides.biasScore);
  }
  return "neutral";
}
