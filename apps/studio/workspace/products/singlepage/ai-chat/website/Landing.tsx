import { Component as HostModulePage } from "../../../../../modules/host/page";

import sourceText from "./page.md?raw";
import { parseAIChatWebsite } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Landing({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount} signedIn={false}>
      <HostModulePage
        variant="ai-chat"
        content={parseAIChatWebsite(text ?? sourceText)}
      />
    </AccountProvider>
  );
}
