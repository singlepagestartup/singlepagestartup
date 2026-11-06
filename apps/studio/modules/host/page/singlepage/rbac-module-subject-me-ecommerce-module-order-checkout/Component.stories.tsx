import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-ecommerce-module-order-checkout",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-ecommerce-module-order-checkout",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "rbac-module-subject-me-ecommerce-module-order-checkout" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "rbac-module-subject-me-ecommerce-module-order-checkout" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
