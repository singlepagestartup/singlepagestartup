import { Component } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/ai-chat-settings";
import sourceText from "./settings.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "./../../../../../../../libs/shared/frontend/components/src/lib/singlepage/ai-chat/Account";
import { aiChatAccount } from "../../../../../../../tools/studio/products/fixtures/ai-chat-account";

export default function Settings({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component copy={parseAIChatServicePage(text ?? sourceText)} />
    </AccountProvider>
  );
}
