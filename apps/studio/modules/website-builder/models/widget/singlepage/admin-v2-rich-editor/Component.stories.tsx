import type { Meta, StoryObj } from "@storybook/react";

import { WebsiteBuilderAdminV2RichEditor } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-admin-v2-rich-editor",
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/admin-v2-rich-editor",
  component: WebsiteBuilderAdminV2RichEditor,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof WebsiteBuilderAdminV2RichEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
