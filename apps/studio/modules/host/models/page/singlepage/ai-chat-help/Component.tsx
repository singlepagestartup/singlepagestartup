import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../../website-builder/models/widget/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";

export function Component() {
  return (
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
      <WebsiteBuilderModuleWidget variant="ai-chat-help" />
    </HostModuleLayout>
  );
}
