import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";

export function Component() {
  return (
    <HostModuleLayout
      variant="ai-chat-header"
      page="settings"
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="ai-chat-account"
          page="settings"
          onNavigate={onNavigate}
        />
      )}
    >
      <RbacModuleSubject variant="ai-chat-settings" />
    </HostModuleLayout>
  );
}
