export function Component() {
  return (
    <div
      role="status"
      aria-label="Loading category"
      className="min-w-0 animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="aspect-square bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="h-4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}
