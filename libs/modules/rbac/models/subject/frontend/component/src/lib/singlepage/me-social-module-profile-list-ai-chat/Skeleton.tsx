export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading projects"
      className="grid gap-4"
    >
      <span className="sr-only">Loading projects…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-11 rounded-xl bg-muted" />
        <div className="h-11 rounded-xl bg-muted" />
        <div className="h-11 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
