import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { useAIChatProjectHref } from "../../../../rbac/subject/singlepage/account/Account";

export function Component() {
  const projectHref = useAIChatProjectHref();
  return (
    <HostModuleLayout
      variant="service-ai-chat"
      page="help"
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="account"
          showTokens
          page="help"
          onNavigate={onNavigate}
        />
      )}
    >
      <WebsiteBuilderModuleWidget
        variant="content-ai-chat-help"
        projectHref={projectHref}
      />
    </HostModuleLayout>
  );
}
