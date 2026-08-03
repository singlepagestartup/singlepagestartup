import {
  ArticleOverviewDefault,
  type ArticleOverviewDefaultProps,
  defaultArticleOverviewDefaultProps,
} from "../../../article/singlepage/overview-default/Component";

export { defaultArticleOverviewDefaultProps };
export type { ArticleOverviewDefaultProps };

export function ArticleOverviewDefaultWidget(
  props?: Partial<ArticleOverviewDefaultProps>,
) {
  return (
    <div
      data-ds-block="blog.widget.article-overview-default"
      data-ds-imports="blog.article.overview-default"
      data-ds-layer="singlepage"
      data-ds-routes="blog.article.overview-default"
    >
      <ArticleOverviewDefault {...props} />
    </div>
  );
}
