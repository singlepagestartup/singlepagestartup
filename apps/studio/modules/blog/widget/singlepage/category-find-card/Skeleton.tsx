import { Skeleton as CategorySkeleton } from "../../../category";
export function Skeleton() {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-label="Loading categories"
      data-module="blog"
      data-model="widget"
      data-variant="category-find-card"
      data-skeleton-layout="grid"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading categories…</span>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((id) => (
          <CategorySkeleton key={id} variant="card" />
        ))}
      </div>
    </section>
  );
}
