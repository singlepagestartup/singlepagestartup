import type { IComponentProps } from "./interface";
import {
  Component as Category,
  defaultCategoryCardProps,
} from "../../../category";
import { Skeleton } from "./Skeleton";
export function Component({
  title = "Product categories",
  description,
  categories = defaultCategories,
  loading = false,
}: IComponentProps) {
  if (loading) return <Skeleton />;
  return (
    <section
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      data-module="ecommerce"
      data-model="widget"
      data-variant="category-find-card"
      data-ds-block="ecommerce.widget.category-find-card"
      data-ds-layer="singlepage"
    >
      <header className="max-w-2xl space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        {description}
      </header>
      {categories.length ? (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Category key={category.id} {...category} variant="card" />
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
export const defaultCategories = [
  {
    ...defaultCategoryCardProps,
    href: "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default",
  },
  {
    ...defaultCategoryCardProps,
    id: "ecommerce-category-2",
    slug: "design",
    title: "Design",
    image:
      "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
    count: 4,
    href: "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default",
  },
  {
    ...defaultCategoryCardProps,
    id: "ecommerce-category-3",
    slug: "updates",
    title: "Consulting",
    image:
      "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    count: 3,
    href: "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-category-slug--default",
  },
];
