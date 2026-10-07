import { Component } from "@sps/website-builder/models/widget/frontend/component/src/lib/singlepage/ai-chat-landing";
import sourceText from "./page.md?raw";
import { parseAIChatWebsite } from "./content";
import { AccountProvider } from "./../../../../../../../libs/shared/frontend/components/src/lib/singlepage/ai-chat/Account";
import { aiChatAccount } from "../../../../../../../tools/studio/products/fixtures/ai-chat-account";

export default function Landing({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component content={parseAIChatWebsite(text ?? sourceText)} />
    </AccountProvider>
  );
}
