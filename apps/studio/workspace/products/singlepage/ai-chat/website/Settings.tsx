import { Component as RbacModuleWidget } from "../../../../../modules/rbac/widget";
import { Component as RbacModuleSubject } from "../../../../../modules/rbac/subject/index";
import { Component as HostModuleLayout } from "../../../../../modules/host/layout/index";

import sourceText from "./settings.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Settings({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-dashboard"
        page="settings"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="account"
            showTokens
            page="settings"
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleWidget
          variant="subject-me-account-settings"
          showTokens
          copy={parseAIChatServicePage(text ?? sourceText)}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
