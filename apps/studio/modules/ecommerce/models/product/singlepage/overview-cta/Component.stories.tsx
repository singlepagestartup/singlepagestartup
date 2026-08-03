import type { Meta, StoryObj } from "@storybook/react";

import {
  ProductOverviewCta,
  defaultProductOverviewCtaProps,
} from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/overview-cta",
  component: ProductOverviewCta,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultProductOverviewCtaProps,
} satisfies Meta<typeof ProductOverviewCta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
