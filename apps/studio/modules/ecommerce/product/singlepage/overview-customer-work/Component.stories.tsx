import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Product } from "../..";
import { physicalOffer, strategyOffer } from "./fixture";
import type { IComponentProps } from "./interface";

function Preview(props: IComponentProps) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8" lang="ru">
      <Product {...props} variant="overview-customer-work" />
    </div>
  );
}

const meta = {
  id: "modules-ecommerce-models-product-singlepage-overview-customer-work",
  title: "Modules/Ecommerce/Product/Singlepage/overview-customer-work",
  component: Preview,
  parameters: { layout: "fullscreen" },
  args: {
    offer: strategyOffer,
    onAsk: () => {},
    onAdd: () => {},
    onOpenOrder: () => {},
    onOpenDiscussion: () => {},
  },
} satisfies Meta<typeof Preview>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReadyToBuy: Story = { args: { offer: physicalOffer } };
export const Added: Story = { args: { orderId: "418-02" } };
export const Pending: Story = { args: { pendingAction: "add" } };
export const Error: Story = {
  args: { feedback: "Не удалось добавить предложение. Повторите попытку." },
};
