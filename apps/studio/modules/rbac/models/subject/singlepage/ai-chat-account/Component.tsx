import { Component as View } from "./index";
import { AccountProvider } from "../ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
export function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <View page="chat" />
    </AccountProvider>
  );
}
