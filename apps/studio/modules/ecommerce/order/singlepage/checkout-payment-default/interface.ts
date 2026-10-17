import type { PaymentMethod } from "../../shared";

export const variant = "checkout-payment-default";

export interface OrderCheckoutPaymentDefaultProps {
  variant?: "checkout-payment-default";
  initialMethod: PaymentMethod;
  agreementLabel: string;
  actionLabel: string;
  backLabel: string;
}

type IVariantInputs = NonNullable<Partial<OrderCheckoutPaymentDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "checkout-payment-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
