export function Skeleton() {
  return (
    <div aria-busy="true">
      <div className="mx-auto grid min-h-96 w-full max-w-7xl animate-pulse gap-6 rounded-3xl bg-muted p-6 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-border" />
        <div className="h-80 rounded-2xl bg-border" />
      </div>
    </div>
  );
}
