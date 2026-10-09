import {
  ArticleFeatured,
  defaultArticleFeaturedProps,
  type ArticleFeaturedProps,
} from "../../../article/singlepage/featured/Component";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default";

type ArticleFindFeaturedItem = ArticleFeaturedProps & {
  id: string;
};

export const defaultArticleFindFeaturedProps = {
  articles: [
    {
      id: "featured-1",
      ...defaultArticleFeaturedProps,
    },
  ] as ArticleFindFeaturedItem[],
};

export type ArticleFindFeaturedProps =
  typeof defaultArticleFindFeaturedProps & {
    /** Removes introduction spacing when composed immediately after a header. */
    compact?: boolean;
  };

export function ArticleFindFeatured(props?: Partial<ArticleFindFeaturedProps>) {
  const { articles, compact = false } = {
    ...defaultArticleFindFeaturedProps,
    ...props,
  };

  return (
    <section
      className={`w-full ${compact ? "" : "pt-8"}`}
      data-ds-block="blog.widget.article-find-featured"
      data-ds-imports="blog.article.featured"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {articles.map((article) => (
            <ArticleFeatured
              key={article.id}
              href={article.href ?? articleOverviewStoryHref}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              coverImage={article.coverImage}
              category={article.category}
              authorName={article.authorName}
              authorSlug={article.authorSlug}
              authorAvatar={article.authorAvatar}
              date={article.date}
              readTime={article.readTime}
              target="_top"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
