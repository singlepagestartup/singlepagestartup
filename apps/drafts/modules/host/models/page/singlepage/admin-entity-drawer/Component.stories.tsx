import type { Meta, StoryObj } from "@storybook/react";

import { AdminEntityDrawer } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-entity-drawer",
  title: "Modules/Host/Models/Page/Singlepage/admin-entity-drawer",
  component: AdminEntityDrawer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminEntityDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
