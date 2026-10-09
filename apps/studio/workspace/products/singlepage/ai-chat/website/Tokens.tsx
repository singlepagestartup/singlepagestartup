import { Component as RbacModuleSubject } from "../../../../../modules/rbac/models/subject/index";
import { Component as HostModuleLayout } from "../../../../../modules/host/models/layout/index";
import { Component as EcommerceModuleOrder } from "../../../../../modules/ecommerce/models/order/index";

import sourceText from "./tokens.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Tokens({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-header"
        page="tokens"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="ai-chat-account"
            page="tokens"
            onNavigate={onNavigate}
          />
        )}
      >
        <EcommerceModuleOrder
          variant="ai-chat-tokens"
          copy={parseAIChatServicePage(text ?? sourceText)}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
