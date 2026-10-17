import type { ProductOverviewDefaultProps } from "../../../product/index";

export const variant = "product-overview-default";

type IVariantInputs = NonNullable<
  Partial<ProductOverviewDefaultProps> & {
    variant?: "product-overview-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "product-overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type { ProductOverviewDefaultProps };
