import type { Meta, StoryObj } from "@storybook/react";

import { SocialWidgetChatListDefault } from "./Component";

const meta = {
  id: "modules-social-models-widget-singlepage-chat-list-default",
  title: "Modules/Social/Models/Widget/Singlepage",
  component: SocialWidgetChatListDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialWidgetChatListDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "chat-list-default",
};
