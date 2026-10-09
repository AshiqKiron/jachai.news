import { ImageResponse } from "next/og";

import {
  buildStoryShareDescription,
  buildStoryShareTitle,
  pickStoryShareLeadImage,
} from "@/lib/story-share";
import { applySourceDerivedSummaries } from "@/lib/source-digest";
import { resolveStoryBySlugDirect } from "@/lib/stories";

export const runtime = "nodejs";

export const alt = "Shorup News story preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveStoryBySlugDirect(slug);
  const story = resolved ? applySourceDerivedSummaries(resolved.story) : null;

  const title = story ? buildStoryShareTitle(story) : "Shorup News";
  const description = story
    ? buildStoryShareDescription(story)
    : "Compare Bangladeshi headlines across outlets.";
  const leadImage = story ? pickStoryShareLeadImage(story) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e3a5f 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {leadImage ? (
          <img
            src={leadImage}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: leadImage
              ? "linear-gradient(to top, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.55) 45%, rgba(15,23,42,0.25) 100%)"
              : "transparent",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 72,
          }}
        >
          {!leadImage ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 6,
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #38bdf8, #2563eb)",
                }}
              />
              <div style={{ fontSize: 36, fontWeight: 700, color: "#f8fafc" }}>Shorup News</div>
              <div style={{ fontSize: 22, color: "#94a3b8" }}>
                Ground News for Bangladesh · বহু মুখের এক খবর
              </div>
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: leadImage ? 48 : 44,
                fontWeight: 700,
                color: "#f8fafc",
                lineHeight: 1.15,
                letterSpacing: -0.5,
              }}
            >
              {truncate(title, 120)}
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#cbd5e1",
                lineHeight: 1.35,
                maxWidth: 960,
              }}
            >
              {truncate(description, 160)}
            </div>
            <div style={{ fontSize: 20, color: "#64748b", marginTop: 8 }}>shorup.news</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
