export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading personal profile"
      className="grid gap-4"
    >
      <span className="sr-only">Loading personal profile…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-11 w-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
