export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading project navigation"
      className="grid gap-4 p-4"
    >
      <span className="sr-only">Loading project navigation…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-8 w-4/5 rounded bg-muted" />
        <div className="h-7 rounded bg-muted" />
        <div className="h-7 rounded bg-muted" />
        <div className="h-7 rounded bg-muted" />
      </div>
    </div>
  );
}
