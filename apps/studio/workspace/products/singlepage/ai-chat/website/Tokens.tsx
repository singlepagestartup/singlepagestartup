import { Component } from "../../../../../modules/ecommerce/models/order/singlepage/ai-chat-tokens/index";
import sourceText from "./tokens.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Tokens({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component copy={parseAIChatServicePage(text ?? sourceText)} />
    </AccountProvider>
  );
}
