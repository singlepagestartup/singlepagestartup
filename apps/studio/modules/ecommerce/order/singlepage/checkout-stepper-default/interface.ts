import type { CheckoutStep } from "../../shared";

export const variant = "checkout-stepper-default";

export interface OrderCheckoutStepperDefaultProps {
  variant?: "checkout-stepper-default";
  currentStep: CheckoutStep;
  showBreadcrumb?: boolean;
}

type IVariantInputs = NonNullable<Partial<OrderCheckoutStepperDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "checkout-stepper-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
