export type Perspective = "neutral" | "establishment" | "opposition" | "international";

export type Factuality = "high" | "mixed" | "low";

export const PERSPECTIVE_META: Record<
  Perspective,
  {
    labelEn: string;
    labelBn: string;
    shortLabelBn: string;
    /** Short English name on political coverage tabs. */
    spectrumTabEn: string;
    color: string;
    order: number;
  }
> = {
  establishment: {
    labelEn: "For government",
    labelBn: "সরকারের পক্ষে",
    shortLabelBn: "পক্ষে",
    spectrumTabEn: "For government",
    color: "#6B94C8",
    order: 0,
  },
  opposition: {
    labelEn: "Against government",
    labelBn: "সরকারের বিপক্ষে",
    shortLabelBn: "বিপক্ষে",
    spectrumTabEn: "Against government",
    color: "#C48888",
    order: 1,
  },
  neutral: {
    labelEn: "Neutral",
    labelBn: "নিরপেক্ষ",
    shortLabelBn: "নিরপেক্ষ",
    spectrumTabEn: "Neutral",
    color: "#787880",
    order: 2,
  },
  international: {
    labelEn: "International",
    labelBn: "আন্তর্জাতিক",
    shortLabelBn: "আন্তর্জাতিক",
    spectrumTabEn: "International",
    color: "#5BA8A0",
    order: 3,
  },
};

/** Political stories use a government axis. Other topics use the reporting spectrum. */
export type CoverageSpectrumMode = "government" | "reporting";

export type SpectrumCopy = {
  labelEn: string;
  labelBn: string;
  shortLabelEn: string;
  shortLabelBn: string;
};

/** For government → against government → neutral → international. */
export const GOVERNMENT_SPECTRUM_ORDER: Perspective[] = [
  "establishment",
  "opposition",
  "neutral",
  "international",
];

const GOVERNMENT_SPECTRUM: Record<Perspective, SpectrumCopy> = {
  establishment: {
    labelEn: "For government",
    labelBn: "সরকারের পক্ষে",
    shortLabelEn: "For",
    shortLabelBn: "পক্ষে",
  },
  opposition: {
    labelEn: "Against government",
    labelBn: "সরকারের বিপক্ষে",
    shortLabelEn: "Against",
    shortLabelBn: "বিপক্ষে",
  },
  neutral: {
    labelEn: "Neutral",
    labelBn: "নিরপেক্ষ",
    shortLabelEn: "Neutral",
    shortLabelBn: "নিরপেক্ষ",
  },
  international: {
    labelEn: "International",
    labelBn: "আন্তর্জাতিক",
    shortLabelEn: "International",
    shortLabelBn: "আন্তর্জাতিক",
  },
};

export function spectrumOrder(mode: "government"): Perspective[] {
  void mode;
  return GOVERNMENT_SPECTRUM_ORDER;
}

export function spectrumCopy(perspective: Perspective, mode: "government"): SpectrumCopy {
  void mode;
  return GOVERNMENT_SPECTRUM[perspective];
}

export function compareSpectrumOrder(
  a: Perspective,
  b: Perspective,
  mode: "government",
): number {
  return spectrumOrder(mode).indexOf(a) - spectrumOrder(mode).indexOf(b);
}

const SEGMENT_FILL_MIX_TARGET = "#141418";
/** Darken accent colors for small-label segments (coverage bar, chips). */
const SEGMENT_FILL_MIX_WEIGHT = 0.48;

function parseHexRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function mixHexRgb(hex: string, targetHex: string, weight: number): string {
  const base = parseHexRgb(hex);
  const target = parseHexRgb(targetHex);
  if (!base || !target) return hex;
  const channels = base.map((channel, index) =>
    Math.round(channel * (1 - weight) + target[index] * weight),
  );
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Solid fill for coverage segments and active filter chips. */
export function perspectiveSegmentFill(accentColor: string): string {
  return mixHexRgb(accentColor, SEGMENT_FILL_MIX_TARGET, SEGMENT_FILL_MIX_WEIGHT);
}

/** Background + label color for perspective segments. */
export function perspectiveSegmentStyle(accentColor: string): {
  backgroundColor: string;
  color: string;
} {
  return {
    backgroundColor: perspectiveSegmentFill(accentColor),
    color: "#ffffff",
  };
}

/** Map legacy −1..+1 bias to Bangladesh political spectrum labels. */
export function biasScoreToPerspective(score: number | null): Perspective {
  if (score === null) return "neutral";
  if (score <= -0.35) return "opposition";
  if (score >= 0.35) return "establishment";
  return "neutral";
}
