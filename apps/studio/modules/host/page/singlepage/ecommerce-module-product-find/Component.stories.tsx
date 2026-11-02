import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-module-product-find",
  title: "Modules/Host/Page/Singlepage/ecommerce-module-product-find",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "ecommerce-module-product-find" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "ecommerce-module-product-find" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
