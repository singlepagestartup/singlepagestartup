import { memo } from "react";
import type { IComponentProps, CategoryCardProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
export const defaultCategoryCardProps: CategoryCardProps = {
  id: "blog-category-1",
  slug: "engineering",
  title: "Engineering",
  subtitle: "Notes on building with Next.js, Hono and SinglePageStartup.",
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  imageAlt: "A conversation about a project",
  count: 6,
  target: "_top",
};
export const Component = memo(function CategoryCard(props: IComponentProps) {
  const category = { ...defaultCategoryCardProps, ...props };
  return (
    <article
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card"
      data-module="blog"
      data-model="category"
      data-id={category.id}
      data-variant="card"
      data-ds-block="blog.category.card"
      data-ds-layer="singlepage"
    >
      {category.image ? (
        <img
          src={category.image}
          alt={category.imageAlt ?? ""}
          className="aspect-square w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-xl font-semibold leading-6 tracking-tight">
            <a
              target={category.target}
              href={category.href ?? `/blog/categories/${category.slug}`}
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {category.title}
            </a>
          </h3>
          {category.count !== undefined ? (
            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {category.count} articles
            </span>
          ) : null}
        </div>
        <div className="text-sm leading-6 text-muted-foreground">
          {category.subtitleContent ?? <p>{category.subtitle}</p>}
        </div>
        {category.children}
        <a
          target={category.target}
          href={category.href ?? `/blog/categories/${category.slug}`}
          className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          Explore category <SharedIcon variant="phosphor" name="arrow-right" />
        </a>
      </div>
    </article>
  );
});
