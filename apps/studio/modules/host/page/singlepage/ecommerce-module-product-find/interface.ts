export const variant = "ecommerce-module-product-find";

export interface IComponentVariantProps {
  variant?: "ecommerce-module-product-find";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "ecommerce-module-product-find";
}

export interface IComponentPropsExtended extends IComponentProps {}
