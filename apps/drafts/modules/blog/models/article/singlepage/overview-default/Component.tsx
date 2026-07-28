import {
  ArticleCover,
  defaultArticleCoverProps,
  type ArticleCoverProps,
} from "../cover/Component";
import {
  ArticleDetail,
  defaultArticleDetailProps,
  type ArticleDetailProps,
} from "../detail/Component";

export type ArticleOverviewDefaultProps = ArticleDetailProps &
  Pick<ArticleCoverProps, "coverImage">;

export const defaultArticleOverviewDefaultProps = {
  ...defaultArticleDetailProps,
  coverImage: defaultArticleCoverProps.coverImage,
} satisfies ArticleOverviewDefaultProps;

export function ArticleOverviewDefault(
  props?: Partial<ArticleOverviewDefaultProps>,
) {
  const article = { ...defaultArticleOverviewDefaultProps, ...props };

  return (
    <article
      className="w-full"
      data-ds-block="blog.article.overview-default"
      data-ds-imports="blog.article.cover blog.article.detail blog.tag.button-default"
      data-ds-layer="singlepage"
    >
      <ArticleCover coverImage={article.coverImage} title={article.title} />
      <ArticleDetail {...article} />
    </article>
  );
}
