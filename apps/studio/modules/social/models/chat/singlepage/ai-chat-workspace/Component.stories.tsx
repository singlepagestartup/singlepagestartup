import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
import { AccountProvider } from "@sps/shared-frontend-components/singlepage/ai-chat/Account";
import { aiChatAccount } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-account";
const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-workspace",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-workspace",
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
