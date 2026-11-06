export const variant = "ecommerce-module-product-slug";

export interface IComponentVariantProps {
  variant?: "ecommerce-module-product-slug";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "ecommerce-module-product-slug";
}

export interface IComponentPropsExtended extends IComponentProps {}
