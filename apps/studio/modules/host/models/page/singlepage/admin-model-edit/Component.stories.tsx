import type { Meta, StoryObj } from "@storybook/react";

import { AdminModelEdit } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-model-edit",
  title: "Modules/Host/Models/Page/Singlepage/admin-model-edit",
  component: AdminModelEdit,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminModelEdit>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
