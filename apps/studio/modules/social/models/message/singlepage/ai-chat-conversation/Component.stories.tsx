import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
const meta = {
  id: "modules-social-models-message-singlepage-ai-chat-conversation",
  title: "Modules/Social/Models/Message/Singlepage/ai-chat-conversation",
  component: Component,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
