import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceCartFlowDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-cart-flow-default",
  title: "Modules/Host/Models/Page/Singlepage",
  component: EcommerceCartFlowDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EcommerceCartFlowDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/ecommerce/products/[ecommerce.products.slug]",
};
