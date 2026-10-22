import type { IComponentProps } from "./interface";
import { Component as Category } from "../../../category";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import {
  ArticleFindCardDefault as ArticleWidget,
  defaultArticleFindCardDefaultProps,
} from "../article-find-card-default/Component";
export function Component({
  category,
  description,
  articles,
}: IComponentProps) {
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-variant="category-overview-default"
      data-ds-block="blog.widget.category-overview-default"
      data-ds-layer="singlepage"
    >
      <Category
        {...category}
        variant="overview-default"
        backHref={
          category?.backHref ??
          "/?path=/story/modules-blog-models-widget-singlepage-category-find-card--default"
        }
        description={
          description ?? (
            <WebsiteBuilderModuleWidget
              variant="content-rich"
              content="<p>Notes on building with Next.js, Hono and SinglePageStartup. <strong>Explore the collection below.</strong></p>"
            />
          )
        }
      >
        <ArticleWidget
          variant="article-find-card-default"
          embedded
          title="Articles in this category"
          articles={
            articles ??
            defaultArticleFindCardDefaultProps.articles.filter(
              (article) => article.category === "engineering",
            )
          }
        />
      </Category>
    </div>
  );
}
