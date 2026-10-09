import type { Meta, StoryObj } from "@storybook/react";

import { AdminSettings } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-settings",
  title: "Modules/Host/Models/Page/Singlepage/admin-settings",
  component: AdminSettings,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
