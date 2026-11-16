export function Skeleton() {
  return (
    <div
      className="flex w-full animate-pulse items-start gap-3"
      role="status"
      aria-label="Loading cart product"
    >
      <div className="size-14 shrink-0 rounded-xl bg-muted sm:size-16" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-8 w-24 rounded-full bg-muted" />
      </div>
    </div>
  );
}
