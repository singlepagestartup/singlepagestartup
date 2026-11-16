import { Component as Subject } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../account/Account";
import { aiChatAccount } from "../../../../account/fixture";
import type { IRepeatState } from "./interface";
function Component({
  showTokens = true,
  empty = false,
  repeatState = "idle",
  repeatOutcome = "success",
}: {
  showTokens?: boolean;
  empty?: boolean;
  repeatState?: IRepeatState;
  repeatOutcome?: "success" | "error";
} = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Subject
        variant="me-ecommerce-module-order-list-ai-chat"
        showTokens={showTokens}
        empty={empty}
        repeatState={repeatState}
        repeatOutcome={repeatOutcome}
      />
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-ecommerce-module-order-list-ai-chat",
  title: "Modules/RBAC/Subject/Singlepage/me/ecommerce/order/list/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { showTokens: true, empty: false },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Empty: StoryObj<typeof meta> = { args: { empty: true } };
export const WithoutTokens: StoryObj<typeof meta> = {
  args: { showTokens: false },
};
export const RepeatConfirmation: StoryObj<typeof meta> = {
  args: { repeatState: "confirmation", showTokens: false },
};
export const Repeating: StoryObj<typeof meta> = {
  args: { repeatState: "pending", showTokens: false },
};
export const RepeatSuccess: StoryObj<typeof meta> = {
  args: { repeatState: "success", showTokens: false },
};
export const RepeatError: StoryObj<typeof meta> = {
  args: { repeatState: "error", repeatOutcome: "error", showTokens: false },
};
