export function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {[0, 1, 2].map((id) => (
        <div key={id} className="h-56 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
