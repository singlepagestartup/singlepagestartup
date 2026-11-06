import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-module-category-slug",
  title: "Modules/Host/Page/Singlepage/ecommerce-module-category-slug",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "ecommerce-module-category-slug" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "ecommerce-module-category-slug" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
