import { Component as RbacModuleIdentity } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <RbacModuleIdentity variant="ai-chat-login" />;
}

const meta = {
  id: "modules-rbac-models-identity-singlepage-ai-chat-login",
  title: "Modules/Rbac/Models/Identity/Singlepage/ai-chat-login",
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
