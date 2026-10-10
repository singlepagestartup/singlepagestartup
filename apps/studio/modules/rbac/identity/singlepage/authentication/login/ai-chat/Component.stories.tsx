import { Component as RbacModuleIdentity } from "../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <RbacModuleIdentity variant="authentication-login-ai-chat" />;
}

const meta = {
  id: "modules-rbac-models-identity-singlepage-authentication-login-ai-chat",
  title: "Modules/Rbac/Models/Identity/Singlepage/authentication/login/ai-chat",
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
