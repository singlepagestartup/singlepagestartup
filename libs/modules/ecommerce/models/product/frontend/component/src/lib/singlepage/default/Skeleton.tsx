export function Component() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="min-w-0 animate-pulse rounded-3xl border border-border bg-card p-4"
    >
      <div className="aspect-[4/3] rounded-2xl bg-muted" />
      <div className="space-y-4 p-3 pt-6">
        <div className="h-6 w-3/4 rounded bg-muted" />
        <div className="h-4 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-11 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
