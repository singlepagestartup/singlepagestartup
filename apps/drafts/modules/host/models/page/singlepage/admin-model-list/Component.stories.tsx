import type { Meta, StoryObj } from "@storybook/react";

import { AdminModelList } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-model-list",
  title: "Modules/Host/Models/Page/Singlepage",
  component: AdminModelList,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminModelList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/admin/:moduleSlug/:modelSlug",
};
