import { Component as BlogModuleWidget } from "../../../../blog/widget/index";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget/index";
import type { ArticleOverviewDefaultProps } from "../../../../blog/widget/singlepage/article-overview-default/Component";
import type { ProductOverviewDefaultProps } from "../../../../ecommerce/widget/singlepage/product-overview-default/Component";

export interface HostWidgetDefaultProps {
  externalModule?: "blog" | "ecommerce";
  className?: string;
  articleProps?: Partial<ArticleOverviewDefaultProps>;
  productProps?: Partial<ProductOverviewDefaultProps>;
}
export function HostWidgetDefault({
  externalModule = "blog",
  className,
  articleProps,
  productProps,
}: HostWidgetDefaultProps = {}) {
  return (
    <div
      data-ds-block="host.widget.default"
      data-ds-layer="singlepage"
      className={className}
    >
      {externalModule === "blog" ? (
        <BlogModuleWidget
          variant="article-overview-default"
          {...articleProps}
        />
      ) : (
        <EcommerceModuleWidget
          variant="product-overview-default"
          {...productProps}
        />
      )}
    </div>
  );
}
