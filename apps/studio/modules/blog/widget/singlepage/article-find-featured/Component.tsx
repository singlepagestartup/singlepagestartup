import { Component as BlogModuleArticle } from "../../../article";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default";

export interface ArticleFindFeaturedProps {
  count: number;
  /** Removes introduction spacing when composed immediately after a header. */
  compact?: boolean;
}

export const defaultArticleFindFeaturedProps: ArticleFindFeaturedProps = {
  count: 1,
};

export function ArticleFindFeatured({
  count = 1,
  compact = false,
}: Partial<ArticleFindFeaturedProps> = {}) {
  return (
    <section
      className={`w-full ${compact ? "" : "pt-8"}`}
      data-ds-block="blog.widget.article-find-featured"
      data-ds-imports="blog.article.featured"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {Array.from({ length: count }, (_, index) => (
            <BlogModuleArticle
              key={`featured-${index}`}
              variant="featured"
              href={articleOverviewStoryHref}
              target="_top"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
