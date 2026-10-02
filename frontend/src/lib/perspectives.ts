export type Perspective = "independent" | "neutral" | "establishment" | "opposition" | "international";

export type Factuality = "high" | "mixed" | "low";

export const PERSPECTIVE_META: Record<
  Perspective,
  { labelEn: string; labelBn: string; color: string; order: number }
> = {
  opposition: {
    labelEn: "Opposition lean",
    labelBn: "বিরোধী ঝুঁক",
    color: "#38bdf8",
    order: 0,
  },
  neutral: {
    labelEn: "Neutral",
    labelBn: "নিরপেক্ষ",
    color: "#a1a1aa",
    order: 1,
  },
  independent: {
    labelEn: "Independent",
    labelBn: "স্বাধীন",
    color: "#4ade80",
    order: 2,
  },
  establishment: {
    labelEn: "Establishment lean",
    labelBn: "সরকার-ঝুঁক",
    color: "#fb7185",
    order: 3,
  },
  international: {
    labelEn: "International",
    labelBn: "আন্তর্জাতিক",
    color: "#c084fc",
    order: 4,
  },
};

/** Map legacy −1..+1 bias to Bangladesh political spectrum labels. */
export function biasScoreToPerspective(score: number | null): Perspective {
  if (score === null) return "neutral";
  if (score <= -0.35) return "opposition";
  if (score >= 0.35) return "establishment";
  if (score >= -0.1 && score <= 0.1) return "neutral";
  return score < 0 ? "independent" : "independent";
}
