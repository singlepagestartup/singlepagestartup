import type { Meta, StoryObj } from "@storybook/react";

import { SocialWidgetChatOverviewDefault } from "./Component";

const meta = {
  id: "modules-social-models-widget-singlepage-chat-overview-default",
  title: "Modules/Social/Models/Widget/Singlepage",
  component: SocialWidgetChatOverviewDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialWidgetChatOverviewDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "chat-overview-default",
};
