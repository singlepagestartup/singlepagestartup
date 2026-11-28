import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../../";
import { orders } from "../../../subject/singlepage/me/ecommerce-module/order/list/customer-default/fixture";
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-customer-orders",
  title: "Modules/RBAC/Widget/Singlepage/subject-me-customer-orders",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "subject-me-customer-orders",
    orders,
    detailHrefs: {
      [orders[0].id]:
        "/iframe.html?id=modules-rbac-models-widget-singlepage-subject-me-customer-order--default",
      [orders[1].id]:
        "/iframe.html?id=modules-rbac-models-widget-singlepage-subject-me-customer-order--historical",
    },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-customer-orders" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { orders: [] } };
