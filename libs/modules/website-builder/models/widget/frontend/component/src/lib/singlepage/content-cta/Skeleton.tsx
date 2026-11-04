export function Skeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-7xl animate-pulse rounded-2xl border border-border bg-muted p-6"
    >
      <div className="h-6 w-2/3 rounded bg-border" />
      <div className="mt-4 h-24 rounded bg-border" />
    </div>
  );
}
