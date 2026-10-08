import { Component as View } from "./index";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
export function Component() {
  return (
    <View
      data={aiChatAccount.profiles[0]}
      email={aiChatAccount.email}
      balance={aiChatAccount.balance}
      page="chat"
    />
  );
}
