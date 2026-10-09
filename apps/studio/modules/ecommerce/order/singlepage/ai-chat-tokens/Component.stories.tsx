import { Component as EcommerceModuleOrder } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <EcommerceModuleOrder variant="ai-chat-tokens" />;
}

const meta = {
  id: "modules-ecommerce-models-order-singlepage-ai-chat-tokens",
  title: "Modules/Ecommerce/Models/Order/Singlepage/ai-chat-tokens",
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
