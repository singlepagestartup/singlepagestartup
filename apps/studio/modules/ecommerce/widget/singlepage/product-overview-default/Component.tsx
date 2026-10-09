import {
  ProductOverviewDefault,
  defaultProductOverviewDefaultProps,
  type ProductOverviewDefaultProps,
} from "../../../product/singlepage/overview-default/Component";

export { defaultProductOverviewDefaultProps };
export type { ProductOverviewDefaultProps };

export function ProductOverviewDefaultWidget(
  props: Partial<ProductOverviewDefaultProps> = {},
) {
  return (
    <div
      data-ds-block="ecommerce.widget.product-overview-default"
      data-ds-imports="ecommerce.product.overview-default"
      data-ds-layer="singlepage"
    >
      <ProductOverviewDefault {...props} />
    </div>
  );
}
