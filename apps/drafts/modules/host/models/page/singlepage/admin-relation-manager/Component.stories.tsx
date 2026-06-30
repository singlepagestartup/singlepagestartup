import type { Meta, StoryObj } from "@storybook/react";

import { AdminRelationManager } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-relation-manager",
  title: "Modules/Host/Models/Page/Singlepage",
  component: AdminRelationManager,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminRelationManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "admin relation manager",
};
