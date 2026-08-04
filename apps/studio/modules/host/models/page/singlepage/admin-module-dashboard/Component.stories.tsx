import type { Meta, StoryObj } from "@storybook/react";

import { AdminModuleDashboard } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-module-dashboard",
  title: "Modules/Host/Models/Page/Singlepage/admin-module-dashboard",
  component: AdminModuleDashboard,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminModuleDashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
