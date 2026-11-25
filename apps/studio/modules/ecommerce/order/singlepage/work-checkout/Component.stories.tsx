import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Order } from "../..";
import type { IComponentProps } from "./interface";

function Preview(props: IComponentProps) {
  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8" lang="ru">
      <Order {...props} variant="work-checkout" />
    </div>
  );
}

const order = {
  id: "418-02",
  title: "Стратегия продвижения",
  total: 4900,
  resultFilename: "strategy-partnerships.pdf",
  invoiceId: "INV-418-02-V2",
};
const meta = {
  id: "modules-ecommerce-models-order-singlepage-work-checkout",
  title: "Modules/Ecommerce/Order/Singlepage/work-checkout",
  component: Preview,
  parameters: { layout: "fullscreen" },
  args: { order, state: "ready", onPay: () => {}, onDiscussion: () => {} },
} satisfies Meta<typeof Preview>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Locked: Story = {
  args: {
    state: "locked",
    order: { id: order.id, title: order.title, total: order.total },
  },
};
export const Pending: Story = { args: { state: "pending" } };
export const PaymentFailed: Story = { args: { state: "failed" } };
export const Paid: Story = { args: { state: "paid" } };
