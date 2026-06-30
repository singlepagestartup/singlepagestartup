import type { Meta, StoryObj } from "@storybook/react";

import { AdminAccountSettings } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-account-settings",
  title: "Modules/Host/Models/Page/Singlepage",
  component: AdminAccountSettings,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminAccountSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/admin/settings/account",
};
