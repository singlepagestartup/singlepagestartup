export function Skeleton() {
  return (
    <div aria-busy="true">
      <div className="w-full animate-pulse space-y-4">
        <div className="h-6 w-2/3 rounded bg-border" />
        <div className="h-11 w-1/2 rounded bg-border" />
        <div className="h-11 w-1/2 rounded bg-border" />
      </div>
    </div>
  );
}
