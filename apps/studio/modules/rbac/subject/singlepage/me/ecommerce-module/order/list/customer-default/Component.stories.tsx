import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Subject } from "../../../../../..";
import { orders } from "./fixture";
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-ecommerce-module-order-list-customer-default",
  title:
    "Modules/RBAC/Subject/Singlepage/me-ecommerce-module-order-list-customer-default",
  component: Subject,
  args: {
    variant: "me-ecommerce-module-order-list-customer-default",
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
    React.ComponentProps<typeof Subject>,
    { variant: "me-ecommerce-module-order-list-customer-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
