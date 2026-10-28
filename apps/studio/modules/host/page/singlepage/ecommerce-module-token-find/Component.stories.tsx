import type { Meta, StoryObj } from "@storybook/react";
import { Component as Page } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-module-token-find",
  title: "Modules/Host/Page/Singlepage/ecommerce-module-token-find",
  component: Page,
  parameters: { layout: "fullscreen" },
  args: { variant: "ecommerce-module-token-find" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "ecommerce-module-token-find" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
