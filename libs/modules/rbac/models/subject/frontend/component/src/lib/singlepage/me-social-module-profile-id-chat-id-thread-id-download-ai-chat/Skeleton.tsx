export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading document download"
      className="inline-flex"
    >
      <span className="sr-only">Loading document download…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-11 w-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
