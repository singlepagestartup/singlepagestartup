import { Component as RbacModuleSubject } from "../../../../../modules/rbac/subject/index";
import { Component as HostModuleLayout } from "../../../../../modules/host/layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../../modules/website-builder/widget/index";

import sourceText from "./help.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Help({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="service-ai-chat"
        page="help"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="account"
            showTokens
            page="help"
            onNavigate={onNavigate}
          />
        )}
      >
        <WebsiteBuilderModuleWidget
          variant="help-ai-chat"
          copy={parseAIChatServicePage(text ?? sourceText)}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
