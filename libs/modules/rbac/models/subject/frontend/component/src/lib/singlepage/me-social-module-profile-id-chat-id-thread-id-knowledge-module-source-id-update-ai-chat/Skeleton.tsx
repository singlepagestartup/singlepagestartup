export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading knowledge section"
      className="grid gap-4 rounded-xl border border-border p-4"
    >
      <span className="sr-only">Loading knowledge section…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-10 w-32 rounded bg-muted" />
      </div>
    </div>
  );
}
