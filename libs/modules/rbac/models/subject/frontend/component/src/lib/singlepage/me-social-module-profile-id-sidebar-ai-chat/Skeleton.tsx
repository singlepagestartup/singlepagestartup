export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading assistant profile"
      className="grid gap-5 p-5"
    >
      <span className="sr-only">Loading assistant profile…</span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="size-16 rounded-2xl bg-muted" />
        <div className="h-7 w-2/3 rounded bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
