export const variant =
  "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
