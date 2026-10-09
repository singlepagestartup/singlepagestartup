import { Component as RbacModuleSubject } from "../../../../../modules/rbac/subject/index";
import { Component as HostModuleLayout } from "../../../../../modules/host/layout/index";
import { Component as EcommerceModuleOrder } from "../../../../../modules/ecommerce/order/index";

import sourceText from "./tokens.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Tokens({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-header"
        page="tokens"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="account"
            showTokens
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
