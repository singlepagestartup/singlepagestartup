export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading knowledge sections"
      className="grid gap-4 p-4"
    >
      <span className="sr-only">Loading knowledge sections…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
