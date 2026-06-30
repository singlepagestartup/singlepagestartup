import type { Meta, StoryObj } from "@storybook/react";

import { AdminPreviewDialog } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-admin-preview-dialog",
  title: "Modules/Host/Models/Page/Singlepage",
  component: AdminPreviewDialog,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminPreviewDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "admin preview dialog",
};
