export const variant = "me-ecommerce-module-order-checkout-tokens-ai-chat";

export interface ISubjectTokensProps {
  variant?: "me-ecommerce-module-order-checkout-tokens-ai-chat";
}

type IVariantInputs = NonNullable<ISubjectTokensProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-ecommerce-module-order-checkout-tokens-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
