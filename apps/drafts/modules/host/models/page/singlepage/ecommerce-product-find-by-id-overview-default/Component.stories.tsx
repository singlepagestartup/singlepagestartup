import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceProductFindByIdOverviewDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-product-find-by-id-overview-default",
  title:
    "Draft Internals/Host/Models/Page/Singlepage/ecommerce-product-find-by-id-overview-default",
  component: EcommerceProductFindByIdOverviewDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EcommerceProductFindByIdOverviewDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "legacy-static-overview",
};
