import type { Meta, StoryObj } from "@storybook/react";

import { SocialChatWorkspaceDefault } from "./Component";

const meta = {
  id: "modules-social-models-chat-singlepage-workspace-default",
  title: "Modules/Social/Models/Chat/Singlepage",
  component: SocialChatWorkspaceDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialChatWorkspaceDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "workspace-default",
};
