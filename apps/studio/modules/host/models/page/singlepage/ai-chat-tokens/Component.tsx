import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as Tokens } from "../../../../../ecommerce/models/order/singlepage/ai-chat-tokens/index";
import { Component as SubjectAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/index";
export function Component() {
  return (
    <Layout
      page="tokens"
      subjectAccount={({ onNavigate }) => (
        <SubjectAccount page="tokens" onNavigate={onNavigate} />
      )}
    >
      <Tokens />
    </Layout>
  );
}
