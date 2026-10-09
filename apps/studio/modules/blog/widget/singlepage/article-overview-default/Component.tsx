import { ArticleFindByIdTagFind } from "../article-find-by-id-tag-find-default/Component";
import {
  Component as BlogModuleArticle,
  type ArticleOverviewDefaultProps,
  defaultArticleOverviewDefaultProps,
} from "../../../article";

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
      <BlogModuleArticle
        {...props}
        variant="overview-default"
        tagsCard={
          props?.tagsCard ?? (
            <ArticleFindByIdTagFind
              tags={props?.tags ?? defaultArticleOverviewDefaultProps.tags}
            />
          )
        }
      />
    </div>
  );
}
