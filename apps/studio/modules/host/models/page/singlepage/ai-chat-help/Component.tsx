import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as Help } from "../../../../../website-builder/models/widget/singlepage/ai-chat-help/index";
import { Component as SubjectAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/index";
export function Component() {
  return (
    <Layout
      page="help"
      subjectAccount={({ onNavigate }) => (
        <SubjectAccount page="help" onNavigate={onNavigate} />
      )}
    >
      <Help />
    </Layout>
  );
}
