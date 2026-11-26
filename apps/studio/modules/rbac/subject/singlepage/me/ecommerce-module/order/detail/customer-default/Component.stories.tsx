import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Subject } from "../../../../../..";
import { orders } from "../../list/customer-default/fixture";
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-ecommerce-module-order-detail-customer-default",
  title:
    "Modules/RBAC/Subject/Singlepage/me-ecommerce-module-order-detail-customer-default",
  component: Subject,
  args: {
    variant: "me-ecommerce-module-order-detail-customer-default",
    order: orders[1],
    listHref:
      "/iframe.html?id=modules-rbac-models-widget-singlepage-subject-me-customer-orders--default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Subject>,
    { variant: "me-ecommerce-module-order-detail-customer-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
