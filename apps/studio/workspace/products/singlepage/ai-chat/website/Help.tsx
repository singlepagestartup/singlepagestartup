import { Component } from "@sps/website-builder/models/widget/frontend/component/src/lib/singlepage/ai-chat-help";
import sourceText from "./help.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "./../../../../../../../libs/shared/frontend/components/src/lib/singlepage/ai-chat/Account";
import { aiChatAccount } from "../../../../../../../tools/studio/products/fixtures/ai-chat-account";

export default function Help({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component copy={parseAIChatServicePage(text ?? sourceText)} />
    </AccountProvider>
  );
}
