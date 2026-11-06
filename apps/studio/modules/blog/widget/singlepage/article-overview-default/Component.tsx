import type { IComponentProps } from "./interface";
import { ArticleFindByIdTagFind } from "../article-find-by-id-tag-find-default/Component";
import {
  Component as Article,
  type ArticleOverviewDefaultProps,
  defaultArticleOverviewDefaultProps,
} from "../../../article/index";

export { defaultArticleOverviewDefaultProps };
export type { ArticleOverviewDefaultProps };

export function ArticleOverviewDefaultWidget(props?: IComponentProps) {
  return (
    <div
      data-ds-block="blog.widget.article-overview-default"
      data-ds-imports="blog.article.overview-default"
      data-ds-layer="singlepage"
      data-ds-routes="blog.article.overview-default"
      data-module="blog"
      data-model="widget"
      data-variant={props?.variant ?? "article-overview-default"}
    >
      <Article
        {...props}
        variant="overview-default"
        tagsCard={
          props?.tagsCard ??
          ((props?.tags ?? defaultArticleOverviewDefaultProps.tags).length >
          0 ? (
            <ArticleFindByIdTagFind
              tags={props?.tags ?? defaultArticleOverviewDefaultProps.tags}
            />
          ) : undefined)
        }
      />
    </div>
  );
}
