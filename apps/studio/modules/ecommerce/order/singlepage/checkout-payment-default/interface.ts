import type { PaymentMethod } from "../../shared";
import type { IOrderInvoice, IOrderSubscriptionPeriod } from "../../interface";

export const variant = "checkout-payment-default";

export interface OrderCheckoutPaymentDefaultProps {
  variant?: "checkout-payment-default";
  initialMethod: PaymentMethod;
  agreementLabel: string;
  actionLabel: string;
  backLabel: string;
  invoiceChoices?: IOrderInvoice[];
  initialInvoiceId?: string;
  subscriptionPeriods?: IOrderSubscriptionPeriod[];
  initialPeriodId?: string;
}

type IVariantInputs = NonNullable<Partial<OrderCheckoutPaymentDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "checkout-payment-default";
}

export interface IComponentPropsExtended extends OrderCheckoutPaymentDefaultProps {}
