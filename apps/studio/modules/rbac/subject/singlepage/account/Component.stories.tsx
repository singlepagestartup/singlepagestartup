import { Component as RbacModuleSubject } from "../../index";
import { AccountProvider } from "./Account";
import type { ISubjectAccountProps } from "./Component";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";
import type { Meta, StoryObj } from "@storybook/react";
function Example(props: ISubjectAccountProps) {
  return (
    <AccountProvider account={aiChatAccount}>
      <RbacModuleSubject {...props} variant="account" />
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-account",
  title: "Modules/Rbac/Models/Subject/Singlepage/account",
  component: Example,
  parameters: { layout: "centered" },
  args: { signedIn: true, showTokens: false },
  argTypes: {
    signedIn: { control: "boolean" },
    showTokens: { control: "boolean" },
  },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const AIChat: StoryObj<typeof meta> = { args: { showTokens: true } };
export const SignedOut: StoryObj<typeof meta> = { args: { signedIn: false } };
