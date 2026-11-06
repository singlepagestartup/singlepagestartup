import { memo } from "react";
import type { IComponentProps, CategoryCardProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
import fixture from "../admin-v2-table/data.json";

export const frameworkCategoryPreviews: CategoryCardProps[] =
  fixture.records.map((record) => {
    const presentation = fixture.presentation.find(
      (item) => item.id === record.id,
    )!;
    return {
      id: record.id,
      slug: record.slug,
      title: record.title.en,
      subtitle: record.subtitle.en,
      image: presentation.image,
      imageAlt: presentation.imageAlt,
      count: presentation.count,
      href: `/?path=/story/modules-host-models-page-singlepage-blog-module-category-slug--default&args=categorySlug:${record.slug}`,
      target: "_top",
    };
  });
export const defaultCategoryCardProps = frameworkCategoryPreviews[0];
export const Component = memo(function CategoryCard(props: IComponentProps) {
  const category = { ...defaultCategoryCardProps, ...props };
  const compact = category.layout === "compact";
  return (
    <article
      className={`relative isolate flex min-w-0 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground motion-reduce:transition-none ${compact ? "flex-row items-start gap-4 p-4" : "flex-col"}`}
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
          className={
            compact
              ? "aspect-square size-16 shrink-0 rounded-xl object-cover"
              : "aspect-square w-full object-cover"
          }
        />
      ) : null}
      <div
        className={`flex min-w-0 flex-1 flex-col gap-3 ${compact ? "" : "p-5"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-xl font-semibold leading-6 tracking-tight">
            <a
              target={category.target}
              href={category.href ?? `/blog/categories/${category.slug}`}
              aria-label={category.title?.trim() || "Explore category"}
              className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-foreground"
            >
              {category.title}
            </a>
          </h3>
          {category.count !== undefined && !compact ? (
            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {category.count} articles
            </span>
          ) : null}
        </div>
        <div className="text-sm leading-6 text-muted-foreground [&_a]:relative [&_a]:z-10">
          {category.subtitleContent ?? <p>{category.subtitle}</p>}
        </div>
        {category.children ? (
          <div className="[&_a]:relative [&_a]:z-10 [&_button]:relative [&_button]:z-10">
            {category.children}
          </div>
        ) : null}
        {!compact && (
          <span
            aria-hidden="true"
            className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-medium"
          >
            Explore category{" "}
            <SharedIcon variant="phosphor" name="arrow-right" />
          </span>
        )}
      </div>
    </article>
  );
});
