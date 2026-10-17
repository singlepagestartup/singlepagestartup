export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading account"
      className="inline-flex items-center gap-3"
    >
      <span className="sr-only">Loading account…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="size-8 rounded-full bg-muted" />
        <div className="h-5 w-24 rounded bg-muted" />
      </div>
    </div>
  );
}
