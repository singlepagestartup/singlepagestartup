import { Component as HostModuleLayout } from "../../../../../modules/host/layout/index";
import { Component as RbacModuleIdentity } from "../../../../../modules/rbac/identity/index";

import sourceText from "./register.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Register({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout variant="ai-chat-header" page="register">
        <RbacModuleIdentity
          variant="ai-chat-register"
          copy={parseAIChatServicePage(text ?? sourceText)}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
