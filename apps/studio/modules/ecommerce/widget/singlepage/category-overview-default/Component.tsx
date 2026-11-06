import type { IComponentProps } from "./interface";
import { Component as Category } from "../../../category";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import {
  ProductFindCard as ProductWidget,
  defaultProductFindCardProps,
} from "../product-find-card/Component";
export function Component({
  category,
  description,
  products,
}: IComponentProps) {
  return (
    <div
      data-module="ecommerce"
      data-model="widget"
      data-variant="category-overview-default"
      data-ds-block="ecommerce.widget.category-overview-default"
      data-ds-layer="singlepage"
    >
      <Category
        {...category}
        variant="overview-default"
        backHref={
          category?.backHref ??
          "/?path=/story/modules-ecommerce-models-widget-singlepage-category-find-card--default"
        }
        description={
          description ?? (
            <WebsiteBuilderModuleWidget
              variant="content-rich"
              content="<p>Websites, applications and tools for your next project. <strong>Explore the collection below.</strong></p>"
            />
          )
        }
      >
        <ProductWidget
          variant="product-find-card"
          embedded
          title="Products in this category"
          products={
            products ??
            defaultProductFindCardProps.products.filter(
              (product) => product.category === "development",
            )
          }
        />
      </Category>
    </div>
  );
}
