export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading sign-in methods"
      className="grid gap-4"
    >
      <span className="sr-only">Loading sign-in methods…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-16 rounded-xl bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
