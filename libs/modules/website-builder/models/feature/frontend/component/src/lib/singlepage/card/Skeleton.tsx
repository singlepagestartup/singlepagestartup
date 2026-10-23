export function Skeleton() {
  return (
    <div aria-busy="true">
      <div className="h-64 w-full animate-pulse rounded-2xl border border-border bg-muted p-6">
        <div className="h-6 w-2/3 rounded bg-border" />
        <div className="mt-6 h-24 rounded bg-border" />
      </div>
    </div>
  );
}
