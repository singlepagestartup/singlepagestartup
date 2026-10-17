import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-ecommerce-module-order-checkout-confirmation",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-ecommerce-module-order-checkout-confirmation",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    variant:
      "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    {
      variant: "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation";
    }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
