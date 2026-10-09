import { Component } from "../../../../../modules/website-builder/models/widget/singlepage/ai-chat-landing/index";
import sourceText from "./page.md?raw";
import { parseAIChatWebsite } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Landing({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component content={parseAIChatWebsite(text ?? sourceText)} />
    </AccountProvider>
  );
}
