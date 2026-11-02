import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-settings",
  title: "Modules/Host/Page/Singlepage/admin-settings",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "admin-settings" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "admin-settings" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
