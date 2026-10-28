export function Skeleton() {
  return (
    <div
      className="w-full animate-pulse space-y-4 rounded-2xl border border-border bg-card p-4"
      role="status"
      aria-label="Loading cart product"
    >
      <div className="h-5 w-2/3 rounded bg-muted" />
      <div className="h-20 rounded-xl bg-muted" />
      <div className="h-4 rounded bg-muted" />
      <div className="h-4 rounded bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
    </div>
  );
}
