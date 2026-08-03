import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceProductFindCard } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-products",
  title: "Modules/Host/Models/Page/Singlepage",
  component: EcommerceProductFindCard,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EcommerceProductFindCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/ecommerce/products",
};
