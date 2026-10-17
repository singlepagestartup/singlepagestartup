import type { IComponentProps } from "./interface";
import {
  Component as Product,
  defaultProductOverviewDefaultProps,
  type ProductOverviewDefaultProps,
} from "../../../product/index";

export { defaultProductOverviewDefaultProps };
export type { ProductOverviewDefaultProps };

export function ProductOverviewDefaultWidget(props: IComponentProps = {}) {
  return (
    <div
      data-ds-block="ecommerce.widget.product-overview-default"
      data-ds-imports="ecommerce.product.overview-default"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="widget"
      data-variant={props.variant ?? "product-overview-default"}
    >
      <Product {...props} variant="overview-default" />
    </div>
  );
}
