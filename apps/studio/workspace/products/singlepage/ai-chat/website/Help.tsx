import { Component as SubjectAccount } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/index";
import { Component as Layout } from "../../../../../modules/host/models/layout/singlepage/ai-chat-header/index";
import { Component } from "../../../../../modules/website-builder/models/widget/singlepage/ai-chat-help/index";
import sourceText from "./help.md?raw";
import { parseAIChatServicePage } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Help({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Layout
        page="help"
        subjectAccount={({ onNavigate }) => (
          <SubjectAccount page="help" onNavigate={onNavigate} />
        )}
      >
        <Component copy={parseAIChatServicePage(text ?? sourceText)} />
      </Layout>
    </AccountProvider>
  );
}
