import { Component } from "./index";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <Component
      data={aiChatAccount.profiles[0]}
      email={aiChatAccount.email}
      balance={aiChatAccount.balance}
      page="chat"
    />
  );
}

const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-user-menu",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-user-menu",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
