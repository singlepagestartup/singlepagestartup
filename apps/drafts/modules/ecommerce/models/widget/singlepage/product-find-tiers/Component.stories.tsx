import type { Meta, StoryObj } from "@storybook/react";

import {
  ProductFindTiers as ProductFindTiersComponent,
  defaultProductFindTiersProps,
} from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Widget/Singlepage/product-find-tiers",
  component: ProductFindTiersComponent,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultProductFindTiersProps,
} satisfies Meta<typeof ProductFindTiersComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
