import type { Meta, StoryObj } from "@storybook/react";

import { SocialWidgetChatWorkspaceDefault } from "./Component";

const meta = {
  id: "modules-social-models-widget-singlepage-chat-workspace-default",
  title: "Modules/Social/Models/Widget/Singlepage",
  component: SocialWidgetChatWorkspaceDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialWidgetChatWorkspaceDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "chat-workspace-default",
};
