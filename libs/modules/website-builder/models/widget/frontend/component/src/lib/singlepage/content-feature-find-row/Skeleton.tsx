export function Skeleton() {
  return (
    <div
      className="mx-auto grid min-h-80 w-full max-w-7xl animate-pulse gap-6 rounded-3xl bg-muted p-8 lg:grid-cols-2"
      role="status"
      aria-label="Loading contact section"
    >
      <div className="h-48 rounded-2xl bg-border" />
      <div className="h-48 rounded-2xl bg-border" />
    </div>
  );
}
