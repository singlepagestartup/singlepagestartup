import type { Meta, StoryObj } from "@storybook/react";

import { ProductPinned, defaultProductPinnedProps } from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/pinned",
  component: ProductPinned,
  parameters: {
    layout: "padded",
  },
  args: defaultProductPinnedProps,
} satisfies Meta<typeof ProductPinned>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
