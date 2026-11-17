import type { Meta, StoryObj } from "@storybook/react";
import { Component as Order } from "../..";
import type {
  IOrderHistoryItem,
  IOrderInvoice,
  IOrderSubscriptionPeriod,
} from "../../interface";
import { defaultOrderHistoryDefaultProps } from "./Component";
import content from "./content.json";

const periods = content.subscriptionPeriods as IOrderSubscriptionPeriod[];
const subscriptionOrders: IOrderHistoryItem[] = periods.map(
  (period, index) => ({
    id: `ORDER-COFFEE-${index + 1}`,
    title: "Coffee beans · 1 kg",
    seller: "Morning Coffee",
    offerId: "morning-coffee-1kg",
    quantity: 1,
    currency: period.currency,
    amount: period.amount,
    status: index === 0 ? "paid" : "awaiting-payment",
    invoiceId: `INV-COFFEE-${index + 1}`,
    date: period.date,
    fulfilment: "Delivery · 10 Nevsky Prospekt, Saint Petersburg",
    charges: period.charges,
    periodLabel: `Subscription COFFEE-01 · ${period.label}`,
    note: period.note,
  }),
);

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-history-default",
  title: "Modules/Ecommerce/Order/Singlepage/order-history-default",
  component: Order,
  parameters: { layout: "padded" },
  args: { ...defaultOrderHistoryDefaultProps, variant: "history-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Order>, { variant: "history-default" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "shared RUB invoice and unpaid USD" };

export const Collapsed: Story = {
  name: "expand services per order",
  args: { expanded: false },
};

export const LegacySharedInvoice: Story = {
  name: "legacy shared amount once",
  args: {
    orders: content.legacyOrders as IOrderHistoryItem[],
    invoices: content.legacyInvoices as IOrderInvoice[],
    description:
      "These older orders share one paid invoice. Their individual amounts are unavailable.",
  },
};

export const SubscriptionPeriods: Story = {
  name: "first and recurring subscription periods",
  args: {
    orders: subscriptionOrders,
    invoices: subscriptionOrders.map((order) => ({
      id: order.invoiceId,
      currency: order.currency,
      amount: order.amount ?? 0,
      status: order.status,
      orderIds: [order.id],
      description: order.periodLabel ?? order.title,
    })),
    description:
      "Coffee and delivery repeat every four weeks. Gift wrapping is charged only for the first delivery.",
  },
};

export const Empty: Story = {
  name: "empty",
  args: {
    orders: [],
    invoices: [],
    description: "Your purchases will appear here after checkout.",
  },
};
