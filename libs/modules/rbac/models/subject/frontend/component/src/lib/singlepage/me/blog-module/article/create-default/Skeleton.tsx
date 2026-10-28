export function Skeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-3xl animate-pulse space-y-5 rounded-2xl border border-border bg-card p-6"
    >
      <div className="h-8 w-1/2 rounded bg-muted" />
      <div className="h-12 rounded bg-muted" />
      <div className="h-24 rounded bg-muted" />
      <div className="h-64 rounded bg-muted" />
    </div>
  );
}
