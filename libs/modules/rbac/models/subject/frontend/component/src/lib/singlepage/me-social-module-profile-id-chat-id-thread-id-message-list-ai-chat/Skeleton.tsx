export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading messages"
      className="grid gap-6 p-5"
    >
      <span className="sr-only">Loading messages…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="mr-10 h-24 rounded-xl bg-muted" />
        <div className="ml-10 h-32 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
