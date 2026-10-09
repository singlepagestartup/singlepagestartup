import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as AccountSettings } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/index";
import { Component as SubjectAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/index";
export function Component() {
  return (
    <Layout
      page="settings"
      subjectAccount={({ onNavigate }) => (
        <SubjectAccount page="settings" onNavigate={onNavigate} />
      )}
    >
      <AccountSettings />
    </Layout>
  );
}
