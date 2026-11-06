import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-module-product-slug",
  title: "Modules/Host/Page/Singlepage/ecommerce-module-product-slug",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "ecommerce-module-product-slug" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "ecommerce-module-product-slug" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
