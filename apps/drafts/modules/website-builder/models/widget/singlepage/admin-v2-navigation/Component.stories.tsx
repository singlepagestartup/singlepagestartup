import type { Meta, StoryObj } from "@storybook/react";

import { WebsiteBuilderAdminV2Navigation } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-admin-v2-navigation",
  title: "Modules/Website Builder/Models/Widget/Singlepage",
  component: WebsiteBuilderAdminV2Navigation,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof WebsiteBuilderAdminV2Navigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "admin-v2-navigation",
};
