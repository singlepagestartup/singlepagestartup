import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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
export const DeliveredService: Story = {
  render: function Render(args) {
    const [savedToKnowledge, setSavedToKnowledge] = useState(false);
    if (args.variant !== "me-ecommerce-module-order-detail-customer-default") {
      return <></>;
    }
    return (
      <Subject
        variant="me-ecommerce-module-order-detail-customer-default"
        order={args.order}
        discussion={args.discussion}
        result={{
          name: "Бриф бизнеса.pdf",
          savedToKnowledge,
          onChange: () => setSavedToKnowledge(!savedToKnowledge),
        }}
      />
    );
  },
  args: {
    order: {
      ...orders[0],
      status: "Выдан",
      lines: [
        {
          id: "brief",
          productId: "brief",
          title: "Бриф бизнеса",
          quantity: 1,
        },
      ],
    },
  },
};
