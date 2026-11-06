import { Component as Order } from "../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../../../../rbac/subject/singlepage/me/account/fixture";

function Component() {
  return <Order variant="checkout-tokens-ai-chat" />;
}

const meta = {
  id: "modules-ecommerce-models-order-singlepage-checkout-tokens-ai-chat",
  title: "Modules/Ecommerce/Order/Singlepage/checkout/tokens/ai-chat",
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
