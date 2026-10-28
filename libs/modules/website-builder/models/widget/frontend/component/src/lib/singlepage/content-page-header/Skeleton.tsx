export function Skeleton() {
  return (
    <section aria-busy="true" className="bg-muted pb-6 pt-8 sm:pb-8 sm:pt-12">
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-5 px-4 sm:px-6 lg:px-8">
        <div className="h-5 w-28 rounded bg-border" />
        <div className="h-14 w-full max-w-3xl rounded-xl bg-border" />
        <div className="h-16 w-full max-w-2xl rounded-xl bg-border" />
      </div>
    </section>
  );
}
