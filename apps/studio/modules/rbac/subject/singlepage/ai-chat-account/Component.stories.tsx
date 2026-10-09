import { Component as RbacModuleSubject } from "../../index";

import { AccountProvider } from "./Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <AccountProvider account={aiChatAccount}>
      <RbacModuleSubject variant="ai-chat-account" page="chat" />
    </AccountProvider>
  );
}

const meta = {
  id: "modules-rbac-models-subject-singlepage-ai-chat-account",
  title: "Modules/Rbac/Models/Subject/Singlepage/ai-chat-account",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
