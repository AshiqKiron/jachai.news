"use client";

import { PerspectiveComparison } from "@/components/PerspectiveComparison";
import { StoryCoverageBlock } from "@/components/StoryCoverageBlock";
import type { ArticleWithSource } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";

type Props = {
  story: Story;
  articles: ArticleWithSource[];
};

export function StoryTabs({ story, articles }: Props) {
  const hasArticles = articles.length > 0;

  return (
    <div className="min-w-0 mt-8">
      {hasArticles ? (
        <StoryCoverageBlock story={story} className="mb-5 max-w-3xl" />
      ) : null}

      <PerspectiveComparison story={story} articles={articles} />
    </div>
  );
}
