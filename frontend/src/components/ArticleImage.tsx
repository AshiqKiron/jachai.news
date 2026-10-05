type Props = {
  src: string;
  alt: string;
  className?: string;
};

const frameClass =
  "bg-neutral-900/50 ring-1 ring-inset ring-black/10 dark:bg-neutral-950 dark:ring-white/15";

/** Remote publisher URLs — plain img avoids per-host Next image config. */
export function ArticleImage({ src, alt, className }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className ? `${frameClass} ${className}` : frameClass}
    />
  );
}
