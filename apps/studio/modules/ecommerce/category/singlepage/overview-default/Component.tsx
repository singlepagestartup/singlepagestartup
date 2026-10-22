import type { IComponentProps } from "./interface";
import { defaultCategoryCardProps } from "../card/Component";
export function Component({
  title = defaultCategoryCardProps.title,
  subtitle = defaultCategoryCardProps.subtitle,
  description,
  media,
  widgets,
  children,
  backHref = "/ecommerce",
}: IComponentProps) {
  return (
    <section
      data-module="ecommerce"
      data-model="category"
      data-variant="overview-default"
      data-ds-block="ecommerce.category.overview-default"
      data-ds-layer="singlepage"
      className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <a
        href={backHref}
        target="_top"
        className="inline-flex min-h-11 items-center rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
      >
        All categories
      </a>
      <header className="rounded-3xl bg-default p-6 text-default-foreground sm:p-10">
        <p className="text-sm text-default-muted-foreground">
          Product category
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-default-muted-foreground">
          {subtitle}
        </p>
      </header>
      {media}
      {description ? (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          {description}
        </div>
      ) : null}
      {widgets}
      {children}
    </section>
  );
}
