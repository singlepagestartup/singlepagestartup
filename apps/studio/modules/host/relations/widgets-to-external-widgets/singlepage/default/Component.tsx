import {
  ArticleOverviewDefaultWidget,
  type ArticleOverviewDefaultProps,
} from "../../../../../blog/models/widget/singlepage/article-overview-default/Component";
import {
  ProductOverviewDefaultWidget,
  type ProductOverviewDefaultProps,
} from "../../../../../ecommerce/models/widget/singlepage/product-overview-default/Component";

interface ExternalWidgetRelation {
  id: string;
  widgetId: string;
  externalWidgetId: string;
  orderIndex: number;
  className?: string;
}

export type HostExternalWidgetLink = ExternalWidgetRelation &
  (
    | {
        externalModule: "blog";
        variant: "article-overview-default";
      }
    | {
        externalModule: "ecommerce";
        variant: "product-overview-default";
      }
  );

export interface HostWidgetsToExternalWidgetsProps {
  link: HostExternalWidgetLink;
  articleProps?: Partial<ArticleOverviewDefaultProps>;
  productProps?: Partial<ProductOverviewDefaultProps>;
}

export const defaultHostExternalArticleLink: HostExternalWidgetLink = {
  id: "preview-article-link",
  widgetId: "preview-article-host-widget",
  externalWidgetId: "preview-blog-overview-widget",
  externalModule: "blog",
  orderIndex: 0,
  variant: "article-overview-default",
};

export const defaultHostExternalProductLink: HostExternalWidgetLink = {
  id: "preview-product-link",
  widgetId: "preview-product-host-widget",
  externalWidgetId: "preview-ecommerce-overview-widget",
  externalModule: "ecommerce",
  orderIndex: 0,
  variant: "product-overview-default",
};

export function HostWidgetsToExternalWidgets({
  link = defaultHostExternalArticleLink,
  articleProps,
  productProps,
}: Partial<HostWidgetsToExternalWidgetsProps>) {
  return (
    <div
      className={link.className}
      data-ds-block="host.widgets-to-external-widgets.default"
      data-ds-imports="blog.widget.article-overview-default ecommerce.widget.product-overview-default"
      data-ds-layer="singlepage"
      data-relation-id={link.id}
      data-external-module={link.externalModule}
      data-external-widget-id={link.externalWidgetId}
      data-external-variant={link.variant}
    >
      {link.externalModule === "blog" ? (
        <ArticleOverviewDefaultWidget {...articleProps} />
      ) : (
        <ProductOverviewDefaultWidget {...productProps} />
      )}
    </div>
  );
}
