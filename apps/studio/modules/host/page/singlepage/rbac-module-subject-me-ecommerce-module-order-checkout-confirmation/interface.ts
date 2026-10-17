export const variant =
  "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation";
}

export interface IComponentPropsExtended extends IComponentProps {}
