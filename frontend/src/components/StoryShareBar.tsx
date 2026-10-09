"use client";

import { useMemo, useState } from "react";

import {
  buildSocialShareUrl,
  buildStoryEmbedSnippet,
  buildStoryReportIssueHref,
  buildStoryShareUrl,
  SOCIAL_SHARE_NETWORKS,
  STORY_DETAIL_SHARE_NETWORKS,
  type SocialShareNetwork,
} from "@/lib/story-share";

type Props = {
  slug: string;
  shareTitle: string;
  variant?: "default" | "detail";
};

const defaultIconButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800/80 bg-ink-900/50 text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100";

const detailSocialClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-white";

const detailUtilityClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800/80 hover:text-zinc-50";

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 22V4a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h2v8h-3a1 1 0 0 0-1 1v3H5a1 1 0 0 1-1-1Z" />
      <path d="M4 11h16" />
    </svg>
  );
}

function EmbedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );
}

function SocialIcon({ network, className }: { network: SocialShareNetwork; className?: string }) {
  switch (network) {
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M14 8h2.5V4h-3c-2.8 0-4.5 1.7-4.5 4.6V11H6v4h3v9h4v-9h3.1L17 11h-4V8.9c0-1 .3-1.5 1.5-1.5Z" />
        </svg>
      );
    case "x":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M17.53 3h3.4l-7.5 8.57L22 21h-6.9l-4.4-5.74L5.5 21H2.1l8.03-9.18L2 3h7.08l3.98 5.26L17.53 3Zm-1.2 16.2h1.88L7.82 4.72H5.77l10.56 14.48Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2Zm0 18.08h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.17-3.11.82.83-3.03-.19-.31a8.15 8.15 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c.01 4.54-3.69 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.29Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.35V9h3.42v1.56h.05c.47-.89 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Z" />
        </svg>
      );
    case "telegram":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
        </svg>
      );
    case "reddit":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.192-.854 2.847-1.416 4.67-1.487l-.885-4.182a.342.342 0 0 1 .14-.133l2.552-1.096a.335.335 0 0 1 .431.136l.941 1.588a5.71 5.71 0 0 1 3.132-.722zm-8.01 9.6a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zm4.502 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z" />
        </svg>
      );
    case "email":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
  }
}

export function StoryShareBar({ slug, shareTitle, variant = "default" }: Props) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const pageUrl = useMemo(() => buildStoryShareUrl(slug), [slug]);
  const reportHref = useMemo(
    () => buildStoryReportIssueHref(slug, shareTitle, pageUrl),
    [pageUrl, shareTitle, slug],
  );

  const networks = variant === "detail" ? STORY_DETAIL_SHARE_NETWORKS : SOCIAL_SHARE_NETWORKS;
  const socialClass = variant === "detail" ? detailSocialClass : defaultIconButtonClass;
  const utilityClass = variant === "detail" ? detailUtilityClass : defaultIconButtonClass;
  const socialIconSize = variant === "detail" ? "h-3.5 w-3.5" : "h-[1.05rem] w-[1.05rem]";
  const utilityIconSize = variant === "detail" ? "h-[1.05rem] w-[1.05rem]" : "h-[1.125rem] w-[1.125rem]";

  async function copyText(text: string, onSuccess: () => void) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    onSuccess();
  }

  async function onCopyLink() {
    await copyText(buildStoryShareUrl(slug), () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  async function onCopyEmbed() {
    await copyText(buildStoryEmbedSnippet(pageUrl), () => {
      setEmbedCopied(true);
      window.setTimeout(() => setEmbedCopied(false), 2000);
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center ${variant === "detail" ? "gap-1" : "justify-end gap-1.5"}`}
      aria-label="Share and report"
    >
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : embedCopied ? "Embed code copied" : ""}
      </span>

      {networks.map((network) => (
        <a
          key={network.id}
          href={buildSocialShareUrl(network.id, pageUrl, shareTitle)}
          target="_blank"
          rel="noopener noreferrer"
          className={socialClass}
          title={`${network.labelEn} · ${network.labelBn}`}
          aria-label={network.labelEn}
        >
          <SocialIcon network={network.id} className={socialIconSize} />
        </a>
      ))}

      {variant === "detail" ? (
        <button
          type="button"
          onClick={() => void onCopyEmbed()}
          className={detailSocialClass}
          title={embedCopied ? "Embed copied · এম্বেড কপি হয়েছে" : "Copy embed code · এম্বেড কোড"}
          aria-label={embedCopied ? "Embed code copied" : "Copy embed code for this story"}
        >
          {embedCopied ? (
            <CheckIcon className={`${socialIconSize} text-emerald-700`} />
          ) : (
            <EmbedIcon className={socialIconSize} />
          )}
        </button>
      ) : null}

      {variant === "detail" ? (
        <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-zinc-700 sm:inline" aria-hidden />
      ) : null}

      <button
        type="button"
        onClick={() => void onCopyLink()}
        className={utilityClass}
        title={copied ? "Copied · লিংক কপি হয়েছে" : "Copy link · লিংক কপি"}
        aria-label={copied ? "Link copied" : "Copy link to this story"}
      >
        {copied ? (
          <CheckIcon className={`${utilityIconSize} text-emerald-400`} />
        ) : (
          <LinkIcon className={utilityIconSize} />
        )}
      </button>

      <a
        href={reportHref}
        target="_blank"
        rel="noopener noreferrer"
        className={utilityClass}
        title="Report an issue · সমস্যা জানান"
        aria-label="Report an issue with this story"
      >
        <FlagIcon className={utilityIconSize} />
      </a>
    </div>
  );
}
