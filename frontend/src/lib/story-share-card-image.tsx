import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import {
  STORY_SHARE_CARD_SIZE,
  type StoryShareCard,
  type StoryShareCardLine,
} from "@/lib/story-share-card";

const FONT_FILES = {
  regular: "NotoSansBengali-Regular.ttf",
  bold: "NotoSansBengali-Bold.ttf",
} as const;

function fontFile(name: string): string {
  const candidates = [
    path.join(process.cwd(), "assets/fonts", name),
    path.join(process.cwd(), "frontend/assets/fonts", name),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]!;
}

let fontsPromise: Promise<{ regular: Buffer; bold: Buffer }> | null = null;

function loadFonts(): Promise<{ regular: Buffer; bold: Buffer }> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(fontFile(FONT_FILES.regular)),
      readFile(fontFile(FONT_FILES.bold)),
    ]).then(([regular, bold]) => ({ regular, bold }));
  }
  return fontsPromise;
}

function countFontSize(text: string): number {
  if (text.length > 72) return 36;
  if (text.length > 42) return 44;
  return 60;
}

function walkbackFontSize(text: string): number {
  if (text.length > 140) return 34;
  if (text.length > 90) return 40;
  return 48;
}

function QuoteLines({
  lines,
  lineStyle,
}: {
  lines: StoryShareCardLine[];
  lineStyle: StoryShareCard["lineStyle"];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 22,
        marginTop: 36,
        paddingTop: 28,
        borderTop: "2px solid rgba(148,163,184,0.35)",
      }}
    >
      {lines.map((line) => (
        <div key={`${line.text}-${line.meta ?? ""}`} style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: lineStyle === "quotes" ? 30 : 28,
              fontWeight: 700,
              lineHeight: 1.3,
              color: "#f8fafc",
            }}
          >
            {lineStyle === "quotes" ? `\u201C${line.text}\u201D` : line.text}
          </div>
          {line.meta ? (
            <div style={{ fontSize: 22, lineHeight: 1.35, color: "#94a3b8", marginTop: 6 }}>
              {line.meta}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MarkBody() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 68, fontWeight: 700, color: "#f8fafc", letterSpacing: -1 }}>
        khatinews.com
      </div>
      <div style={{ fontSize: 32, color: "#94a3b8", marginTop: 22 }}>
        Ground News for Bangladesh
      </div>
      <div style={{ fontSize: 36, color: "#e2e8f0", marginTop: 14 }}>বহু মুখের এক খবর</div>
    </div>
  );
}

function WalkbackBody({ card }: { card: StoryShareCard }) {
  const outlet = card.lines[0]?.meta ?? "";
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: card.accent }}>{card.kickerBn}</div>
        <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 8 }}>{card.kickerEn}</div>
        <div
          style={{
            fontSize: walkbackFontSize(card.countBn),
            fontWeight: 700,
            lineHeight: 1.45,
            color: "#f8fafc",
            marginTop: 40,
          }}
        >
          {card.countBn}
        </div>
        {outlet ? (
          <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 28 }}>{outlet}</div>
        ) : null}
      </div>
      <div style={{ paddingTop: 28, fontSize: 24, color: "#64748b" }}>khatinews.com</div>
    </div>
  );
}

function RevealBody({ card }: { card: StoryShareCard }) {
  const stacked = card.lines.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: stacked ? "flex-start" : "center",
          marginTop: stacked ? 36 : 0,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: card.accent }}>{card.kickerBn}</div>
        <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 8 }}>{card.kickerEn}</div>
        <div
          style={{
            fontSize: countFontSize(card.countEn),
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#f8fafc",
            marginTop: stacked ? 32 : 36,
            letterSpacing: -0.5,
          }}
        >
          {card.countEn}
        </div>
        <div style={{ fontSize: 32, lineHeight: 1.4, color: "#cbd5e1", marginTop: 18 }}>
          {card.countBn}
        </div>
        {stacked ? <QuoteLines lines={card.lines} lineStyle={card.lineStyle} /> : null}
      </div>
      <div style={{ paddingTop: 28, fontSize: 24, color: "#64748b" }}>khatinews.com</div>
    </div>
  );
}

function storyShareCardElement(card: StoryShareCard) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(160deg, #020617 0%, #0f172a 52%, #1e3a5f 100%)",
        fontFamily: "Noto Sans Bengali",
        padding: 72,
      }}
    >
      <div
        style={{
          width: 132,
          height: 8,
          borderRadius: 4,
          background: card.accent,
        }}
      />
      {card.kind === "mark" ? (
        <MarkBody />
      ) : card.kind === "walkback" ? (
        <WalkbackBody card={card} />
      ) : (
        <RevealBody card={card} />
      )}
    </div>
  );
}

/** PNG response for the square story card. Noto Sans Bengali covers Bangla and Latin. */
export async function renderStoryShareCard(card: StoryShareCard): Promise<ImageResponse> {
  const fonts = await loadFonts();
  return new ImageResponse(storyShareCardElement(card), {
    ...STORY_SHARE_CARD_SIZE,
    fonts: [
      { name: "Noto Sans Bengali", data: fonts.regular, weight: 400, style: "normal" },
      { name: "Noto Sans Bengali", data: fonts.bold, weight: 700, style: "normal" },
    ],
  });
}
