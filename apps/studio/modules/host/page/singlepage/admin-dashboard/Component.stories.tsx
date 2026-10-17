import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-dashboard",
  title: "Modules/Host/Page/Singlepage/admin-dashboard",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "admin-dashboard" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "admin-dashboard" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
