export default function StoryLoading() {
  return (
    <div className="space-y-8 pb-8 animate-pulse">
      <div className="h-4 w-24 rounded bg-zinc-800" />
      <header className="max-w-3xl space-y-4">
        <div className="h-3 w-40 rounded bg-zinc-800" />
        <div className="h-10 w-full max-w-2xl rounded bg-zinc-800" />
        <div className="h-6 w-3/4 max-w-xl rounded bg-zinc-800/80" />
        <div className="h-16 w-full rounded bg-zinc-800/60" />
        <div className="h-3 w-full rounded bg-zinc-800/50" />
      </header>
      <div className="h-12 rounded-xl bg-zinc-800/40" />
      <div className="h-64 rounded-xl bg-zinc-800/30" />
    </div>
  );
}
