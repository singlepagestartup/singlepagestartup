export const variant = "checkout-confirmation-default";

export interface OrderCheckoutNextStep {
  title: string;
  description: string;
}

export interface OrderCheckoutConfirmationDefaultProps {
  variant?: "checkout-confirmation-default";
  title: string;
  description: string;
  email: string;
  orderId: string;
  date: string;
  amount: string;
  status: string;
  nextSteps: OrderCheckoutNextStep[];
  continueShoppingLabel: string;
  continueShoppingHref: string;
  homeLabel: string;
  homeHref: string;
}

type IVariantInputs = NonNullable<
  Partial<OrderCheckoutConfirmationDefaultProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "checkout-confirmation-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
