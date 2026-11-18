import { Component as Order } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultOrderCheckoutPaymentDefaultProps } from "./Component";
import type { IOrderInvoice, IOrderSubscriptionPeriod } from "../../interface";
import purchaseContent from "../history-default/content.json";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-checkout-payment-default",
  title: "Modules/Ecommerce/Order/Singlepage/order-checkout-payment-default",
  component: Order,
  parameters: {
    layout: "padded",
  },
  args: {
    ...defaultOrderCheckoutPaymentDefaultProps,
    variant: "checkout-payment-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Order>,
    { variant: "checkout-payment-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Paypal: Story = {
  name: "paypal",
  args: {
    initialMethod: "paypal",
  },
};

export const Bank: Story = {
  name: "bank",
  args: {
    initialMethod: "bank",
  },
};

export const Crypto: Story = {
  name: "crypto",
  args: {
    initialMethod: "crypto",
  },
};

export const CurrencyInvoices: Story = {
  name: "two RUB orders and separate USD invoice",
  args: {
    invoiceChoices: (purchaseContent.invoices as IOrderInvoice[]).map(
      (invoice) => ({ ...invoice, status: "awaiting-payment" }),
    ),
    initialInvoiceId: "INV-RUB-414",
  },
};

export const MixedPaymentStates: Story = {
  name: "paid RUB invoice and unpaid USD invoice",
  args: {
    invoiceChoices: purchaseContent.invoices as IOrderInvoice[],
    initialInvoiceId: "INV-USD-414",
  },
};

export const SubscriptionFirstDelivery: Story = {
  name: "subscription first delivery with wrapping",
  args: {
    subscriptionPeriods:
      purchaseContent.subscriptionPeriods as IOrderSubscriptionPeriod[],
    initialPeriodId: "coffee-first",
    agreementLabel:
      "I agree to pay this delivery separately. Gift wrapping is charged only for the first delivery.",
  },
};

export const SubscriptionRecurringDelivery: Story = {
  name: "subscription recurring delivery without wrapping",
  args: {
    subscriptionPeriods:
      purchaseContent.subscriptionPeriods as IOrderSubscriptionPeriod[],
    initialPeriodId: "coffee-next",
    agreementLabel:
      "I agree to pay this delivery separately after its stock and price are confirmed.",
  },
};
