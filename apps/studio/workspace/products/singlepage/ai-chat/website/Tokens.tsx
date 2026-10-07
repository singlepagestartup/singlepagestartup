import { Component } from "@sps/ecommerce/models/order/frontend/component/src/lib/singlepage/ai-chat-tokens";
import sourceText from "./tokens.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "./../../../../../../../libs/shared/frontend/components/src/lib/singlepage/ai-chat/Account";
import { aiChatAccount } from "../../../../../../../tools/studio/products/fixtures/ai-chat-account";

export default function Tokens({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component copy={parseAIChatServicePage(text ?? sourceText)} />
    </AccountProvider>
  );
}
