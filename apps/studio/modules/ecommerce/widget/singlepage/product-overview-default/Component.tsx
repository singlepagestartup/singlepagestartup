import {
  Component as EcommerceModuleProduct,
  defaultProductOverviewDefaultProps,
  type ProductOverviewDefaultProps,
} from "../../../product";

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
      <EcommerceModuleProduct {...props} variant="overview-default" />
    </div>
  );
}
