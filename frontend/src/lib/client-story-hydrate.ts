import { getStoryBySlug, type Story } from "@/lib/demo-data";
import {
  containsMixedScriptGlued,
  hasBengaliScript,
  normalizeMixedScriptHeadline,
} from "@/lib/mixed-script-text";

/** Repair client-side story text (localStorage / demo seed) before render. */
export function hydrateClientStory(story: Story): Story {
  const demo = getStoryBySlug(story.slug);
  let titleBn = normalizeMixedScriptHeadline(story.titleBn);

  if (containsMixedScriptGlued(titleBn) && demo?.titleBn) {
    titleBn = demo.titleBn;
  } else if (demo?.titleBn && hasBengaliScript(demo.titleBn) && !hasBengaliScript(titleBn)) {
    titleBn = demo.titleBn;
  }

  const summaryBn = story.summaryBn
    ? normalizeMixedScriptHeadline(story.summaryBn)
    : story.summaryBn;

  return { ...story, titleBn, summaryBn };
}

export function hydrateClientStories(stories: Story[]): Story[] {
  return stories.map(hydrateClientStory);
}
