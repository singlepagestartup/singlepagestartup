import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-model-edit",
  title: "Modules/Host/Page/Singlepage/admin-model-edit",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "admin-model-edit" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "admin-model-edit" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
