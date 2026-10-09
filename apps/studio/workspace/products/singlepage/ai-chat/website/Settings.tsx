import { Component as RbacModuleSubject } from "../../../../../modules/rbac/models/subject/index";
import { Component as HostModuleLayout } from "../../../../../modules/host/models/layout/index";

import sourceText from "./settings.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Settings({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-header"
        page="settings"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="ai-chat-account"
            page="settings"
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleSubject
          variant="ai-chat-settings"
          copy={parseAIChatServicePage(text ?? sourceText)}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
