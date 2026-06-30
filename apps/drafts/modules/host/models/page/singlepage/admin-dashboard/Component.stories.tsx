import type { Meta, StoryObj } from "@storybook/react";

import { AdminDashboard } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-dashboard",
  title: "Modules/Host/Models/Page/Singlepage",
  component: AdminDashboard,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminDashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/admin",
};
