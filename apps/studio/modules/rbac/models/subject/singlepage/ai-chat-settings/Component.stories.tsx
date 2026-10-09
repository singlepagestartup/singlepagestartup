import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../ai-chat-account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <Component />;
}

const meta = {
  id: "modules-rbac-models-subject-singlepage-ai-chat-settings",
  title: "Modules/Rbac/Models/Subject/Singlepage/ai-chat-settings",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
