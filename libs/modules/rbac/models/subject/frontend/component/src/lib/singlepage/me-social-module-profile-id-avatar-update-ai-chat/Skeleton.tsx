export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading avatar"
      className="mt-6 flex items-center gap-4"
    >
      <span className="sr-only">Loading avatar…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="size-20 rounded-2xl bg-muted" />
        <div className="h-11 w-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
