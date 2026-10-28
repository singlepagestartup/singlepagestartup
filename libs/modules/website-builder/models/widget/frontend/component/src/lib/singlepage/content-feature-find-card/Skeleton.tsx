export function Skeleton() {
  return (
    <div aria-busy="true">
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6 px-4 py-12">
        <div className="h-9 w-1/2 rounded-lg bg-border" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-64 rounded-2xl bg-border" />
          ))}
        </div>
      </div>
    </div>
  );
}
