import type { IComponentProps, ArticleFindFeaturedProps } from "./interface";
export type { ArticleFindFeaturedProps } from "./interface";
import { Component as Article } from "../../../article/index";
import { frameworkArticlePreviews } from "../../../article";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default";

export const defaultArticleFindFeaturedProps: ArticleFindFeaturedProps = {
  count: 1,
};

export function ArticleFindFeatured({
  variant = "article-find-featured",
  count = 1,
  compact = false,
  title,
  description,
  articles,
}: IComponentProps = {}) {
  return (
    <section
      className={`w-full ${compact ? "" : "pt-8"}`}
      data-ds-block="blog.widget.article-find-featured"
      data-ds-imports="blog.article.featured"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="widget"
      data-variant={variant}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title ? (
          <h2 className="mb-6 text-3xl font-semibold">{title}</h2>
        ) : null}
        {description}
        <div className="grid gap-6">
          {(articles ?? frameworkArticlePreviews)
            .slice(0, count)
            .map((article) => (
              <Article
                key={article.id}
                {...article}
                variant="featured"
                href={article.href ?? articleOverviewStoryHref}
                target="_top"
              />
            ))}
        </div>
      </div>
    </section>
  );
}
