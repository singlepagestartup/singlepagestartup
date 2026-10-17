export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading message composer"
      className="grid gap-3 p-4"
    >
      <span className="sr-only">Loading message composer…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="ml-auto h-11 w-28 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
