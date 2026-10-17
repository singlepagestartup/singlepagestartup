import { Component as Subject } from "../../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../account/Account";
import { aiChatAccount } from "../../../../../account/fixture";
function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <Subject variant="me-ecommerce-module-order-checkout-tokens-ai-chat" />
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-ecommerce-module-order-checkout-tokens-ai-chat",
  title:
    "Modules/RBAC/Subject/Singlepage/me/ecommerce/order/checkout/tokens/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
