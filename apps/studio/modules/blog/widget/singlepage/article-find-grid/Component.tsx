import type { IComponentProps } from "./interface";
import { Component as Article } from "../../../article";
export function Component({
  id,
  eyebrow,
  title,
  description,
  actions,
  articles,
  cardLayout,
  articleActionLabel,
}: IComponentProps) {
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className={`mx-auto max-w-7xl border-t border-border px-5 py-14 outline-none @3xl:px-8 @3xl:py-20 ${cardLayout === "module" ? "bg-card" : ""}`}
      data-module="blog"
      data-model="widget"
      data-variant="article-find-grid"
      data-ds-block="blog.widget.article-find-grid"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
          <h2
            id={`${id}-title`}
            className={`mt-4 text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl ${cardLayout === "module" ? "max-w-xl" : ""}`}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      <div
        className={`mt-8 grid ${cardLayout === "module" ? "gap-4 @xl:grid-cols-2 @4xl:grid-cols-4" : "gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3"}`}
      >
        {articles.map((article) => (
          <Article
            key={article.id}
            variant="card"
            layout={cardLayout}
            title={article.title}
            excerpt={article.excerpt}
            slug={article.slug}
            href={article.href}
            coverImage={article.coverImage}
            target={article.target}
            category={article.category}
            actionLabel={articleActionLabel}
          />
        ))}
      </div>
    </section>
  );
}
