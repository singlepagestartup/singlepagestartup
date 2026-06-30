import type { Meta, StoryObj } from "@storybook/react";

import { AdminModelEdit } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-model-edit",
  title: "Modules/Host/Models/Page/Singlepage",
  component: AdminModelEdit,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminModelEdit>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/admin/:moduleSlug/:modelSlug/:id",
};
