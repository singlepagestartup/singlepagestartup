import type { Meta, StoryObj } from "@storybook/react";

import {
  ProductOverviewPurchase,
  defaultProductOverviewPurchaseProps,
} from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/overview-purchase",
  component: ProductOverviewPurchase,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultProductOverviewPurchaseProps,
} satisfies Meta<typeof ProductOverviewPurchase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
