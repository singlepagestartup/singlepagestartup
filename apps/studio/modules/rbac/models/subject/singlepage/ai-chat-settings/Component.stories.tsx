import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
import { AccountProvider } from "./Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
const meta = {
  id: "modules-rbac-models-subject-singlepage-ai-chat-settings",
  title: "Modules/Rbac/Models/Subject/Singlepage/ai-chat-settings",
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
