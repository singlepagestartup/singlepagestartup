import { Component as SubjectAccount } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/index";
import { Component as Layout } from "../../../../../modules/host/models/layout/singlepage/ai-chat-header/index";
import { Component } from "../../../../../modules/ecommerce/models/order/singlepage/ai-chat-tokens/index";
import sourceText from "./tokens.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Tokens({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Layout
        page="tokens"
        subjectAccount={({ onNavigate }) => (
          <SubjectAccount page="tokens" onNavigate={onNavigate} />
        )}
      >
        <Component copy={parseAIChatServicePage(text ?? sourceText)} />
      </Layout>
    </AccountProvider>
  );
}
