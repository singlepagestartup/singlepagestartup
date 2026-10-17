import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-model-list",
  title: "Modules/Host/Page/Singlepage/admin-model-list",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "admin-model-list" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "admin-model-list" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
