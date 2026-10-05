import { ArticleImage } from "@/components/ArticleImage";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import type { ArticleWithSource } from "@/lib/coverage";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

type Slot = {
  role: "opposition" | "anchor" | "establishment";
  labelBn: string;
  labelEn: string;
  article: ArticleWithSource | null;
};

const ANCHOR_ORDER: Perspective[] = ["neutral", "international"];

function pickArticle(
  articles: ArticleWithSource[],
  perspectives: Perspective[],
  used: Set<string>,
): ArticleWithSource | null {
  for (const perspective of perspectives) {
    const match = articles.find(
      (a) => a.perspective === perspective && !used.has(a.url),
    );
    if (match) {
      used.add(match.url);
      return match;
    }
  }
  return null;
}

function buildSlots(articles: ArticleWithSource[]): Slot[] {
  const used = new Set<string>();
  const opposition = pickArticle(articles, ["opposition"], used);
  const establishment = pickArticle(articles, ["establishment"], used);
  const anchor = pickArticle(articles, ANCHOR_ORDER, used);

  return [
    {
      role: "establishment",
      labelBn: "সরকারের পক্ষে",
      labelEn: "Pro-government",
      article: establishment,
    },
    {
      role: "anchor",
      labelBn: "নিরপেক্ষ / তথ্য",
      labelEn: "Neutral anchor",
      article: anchor,
    },
    {
      role: "opposition",
      labelBn: "সরকারের বিপক্ষে",
      labelEn: "Against the government",
      article: opposition,
    },
  ];
}

type Props = {
  articles: ArticleWithSource[];
};

export function HeadlineClashTriptych({ articles }: Props) {
  const slots = buildSlots(articles);
  const filled = slots.filter((s) => s.article !== null).length;

  if (filled < 2) {
    return null;
  }

  return (
    <section className="mb-6 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">Headline clash</p>
        <p className="mt-1 text-sm text-zinc-400">
          একই ঘটনা — তিন ঝুঁকের শিরোনাম এক নজরে (১০ সেকেন্ডে তুলনা)
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {slots.map((slot) => {
          const article = slot.article;
          const perspective = article?.perspective ?? "neutral";
          const meta = PERSPECTIVE_META[perspective];
          return (
            <article
              key={slot.role}
              className={`flex flex-col rounded-xl border p-4 ${
                slot.role === "anchor"
                  ? "border-zinc-600/80 bg-zinc-800/40"
                  : "border-zinc-800 bg-ink-900/70"
              }`}
            >
              <div>
                <p className="font-bengali text-sm font-semibold leading-snug text-zinc-100">
                  {slot.labelBn}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-400">{slot.labelEn}</p>
              </div>
              {article ? (
                <>
                  <ArticleImage
                    src={resolveArticleImageUrl(article.imageUrl)}
                    alt=""
                    className="mt-2 aspect-[16/10] w-full rounded-lg object-cover"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">{article.sourceName}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.labelBn}
                    </span>
                  </div>
                  <h3 className="mt-2 flex-1 break-words font-display text-base leading-snug text-zinc-50">
                    {article.headline}
                  </h3>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-xs font-medium text-accent hover:underline"
                  >
                    উৎসে পড়ুন →
                  </a>
                </>
              ) : (
                <p className="mt-3 flex-1 text-sm italic text-zinc-600">এই ঝুঁকে এখনো কভার নেই</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
