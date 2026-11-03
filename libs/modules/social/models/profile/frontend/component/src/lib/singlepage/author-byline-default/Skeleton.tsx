export function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Loading author"
      className="flex min-h-16 animate-pulse items-center gap-3 rounded-2xl"
    >
      <span className="size-11 shrink-0 rounded-full bg-muted" />
      <span className="h-4 w-32 rounded bg-muted" />
    </div>
  );
}
