import type {
  IComponentProps,
  OrderCheckoutPaymentDefaultProps,
} from "./interface";
import { OrderCheckoutPaymentDefaultClient } from "./ClientComponent";

export type { OrderCheckoutPaymentDefaultProps } from "./interface";

export const defaultOrderCheckoutPaymentDefaultProps: OrderCheckoutPaymentDefaultProps =
  {
    initialMethod: "card",
    agreementLabel:
      "I agree to the Terms of Service and Privacy Policy. All sales are subject to our refund policy.",
    actionLabel: "Place order",
    backLabel: "Back to details",
  };

export function OrderCheckoutPaymentDefault(props?: IComponentProps) {
  const values = { ...defaultOrderCheckoutPaymentDefaultProps, ...props };
  return (
    <OrderCheckoutPaymentDefaultClient
      variant="checkout-payment-default"
      initialMethod={values.initialMethod}
      agreementLabel={values.agreementLabel}
      actionLabel={values.actionLabel}
      backLabel={values.backLabel}
      invoiceChoices={values.invoiceChoices}
      initialInvoiceId={values.initialInvoiceId}
      subscriptionPeriods={values.subscriptionPeriods}
      initialPeriodId={values.initialPeriodId}
    />
  );
}
