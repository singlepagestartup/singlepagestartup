import type { Meta, StoryObj } from "@storybook/react";

import { SocialChatListDefault } from "./Component";

const meta = {
  id: "modules-social-models-chat-singlepage-list-default",
  title: "Modules/Social/Models/Chat/Singlepage",
  component: SocialChatListDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialChatListDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "list-default",
};
