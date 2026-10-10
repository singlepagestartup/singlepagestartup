import { Component as RbacModuleSubject } from "../../index";

import type { ISettingsProps } from "./Component";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../account/Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example(props: ISettingsProps) {
  return <RbacModuleSubject {...props} variant="account-data" />;
}

const meta = {
  id: "modules-rbac-models-subject-singlepage-account-data",
  title: "Modules/Rbac/Models/Subject/Singlepage/account-data",
  component: Example,
  args: { section: "data", showTokens: false },
  argTypes: {
    section: { control: "select", options: ["data", "purchases"] },
    showTokens: { control: "boolean" },
  },
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

export const Purchases: StoryObj<typeof meta> = {
  args: { section: "purchases" },
};
export const Tokens: StoryObj<typeof meta> = {
  args: { section: "purchases", showTokens: true },
};
