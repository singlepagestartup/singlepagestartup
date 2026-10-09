import { Component as RbacModuleSubject } from "../../../../../modules/rbac/subject/index";
import { Component as HostModuleLayout } from "../../../../../modules/host/layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../../modules/website-builder/widget/index";

import sourceText from "./help.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Help({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-header"
        page="help"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="ai-chat-account"
            page="help"
            onNavigate={onNavigate}
          />
        )}
      >
        <WebsiteBuilderModuleWidget
          variant="ai-chat-help"
          copy={parseAIChatServicePage(text ?? sourceText)}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
