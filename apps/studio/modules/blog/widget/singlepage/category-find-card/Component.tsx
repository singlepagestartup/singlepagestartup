import type { IComponentProps } from "./interface";
import {
  Component as Category,
  frameworkCategoryPreviews,
} from "../../../category";
import { Skeleton } from "./Skeleton";
export function Component({
  title = "Explore the blog",
  description,
  categories = defaultCategories,
  loading = false,
  layout,
}: IComponentProps) {
  if (loading) return <Skeleton />;
  return (
    <section
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      data-module="blog"
      data-model="widget"
      data-variant="category-find-card"
      data-ds-block="blog.widget.category-find-card"
      data-ds-layer="singlepage"
    >
      <header className="max-w-2xl space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        {description}
      </header>
      {categories.length ? (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Category
              key={category.id}
              {...category}
              layout={layout ?? category.layout}
              variant="card"
            />
          ))}
        </div>
      ) : (
        <p
          role="status"
          className="rounded-2xl border border-border bg-card p-8"
        >
          No categories yet.
        </p>
      )}
    </section>
  );
}
export const defaultCategories = frameworkCategoryPreviews;
