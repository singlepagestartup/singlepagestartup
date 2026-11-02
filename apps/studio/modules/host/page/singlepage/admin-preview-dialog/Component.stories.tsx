import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-preview-dialog",
  title: "Modules/Host/Page/Singlepage/admin-preview-dialog",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "admin-preview-dialog" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "admin-preview-dialog" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
