import type { IComponentProps } from "./interface";
import {
  Component as Category,
  frameworkCategoryPreviews,
} from "../../../category";

import {
  ArticleFindCardDefault as ArticleWidget,
  defaultArticleFindCardDefaultProps,
} from "../article-find-card-default/Component";
export function Component({
  category,
  description,
  articles,
}: IComponentProps) {
  const selected =
    frameworkCategoryPreviews.find((item) => item.slug === category?.slug) ??
    frameworkCategoryPreviews[0];
  const collection =
    articles ??
    defaultArticleFindCardDefaultProps.articles.filter(
      (article) => article.categorySlug === selected.slug,
    );
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-variant="category-overview-default"
      data-ds-block="blog.widget.category-overview-default"
      data-ds-layer="singlepage"
    >
      <Category
        {...selected}
        {...category}
        count={collection.length}
        variant="overview-default"
        backHref={
          category?.backHref ??
          "/?path=/story/modules-blog-models-widget-singlepage-category-find-card--default"
        }
        description={description}
      >
        <ArticleWidget
          variant="article-find-card-default"
          embedded
          title="Articles in this category"
          categories={[]}
          articles={collection}
        />
      </Category>
    </div>
  );
}
