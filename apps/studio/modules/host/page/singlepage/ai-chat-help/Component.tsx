import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { useAIChatProjectHref } from "../../../../rbac/subject/singlepage/ai-chat-account/Account";

export function Component() {
  const projectHref = useAIChatProjectHref();
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
      <WebsiteBuilderModuleWidget
        variant="ai-chat-help"
        projectHref={projectHref}
      />
    </HostModuleLayout>
  );
}
