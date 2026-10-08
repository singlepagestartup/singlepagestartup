import { Component } from "../../../../../modules/rbac/models/identity/singlepage/ai-chat-register/index";
import sourceText from "./register.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Register({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component copy={parseAIChatServicePage(text ?? sourceText)} />
    </AccountProvider>
  );
}
