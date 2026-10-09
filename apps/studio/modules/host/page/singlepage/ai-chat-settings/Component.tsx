import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { Component as RbacModuleWidget } from "../../../../rbac/widget";

export function Component() {
  return (
    <HostModuleLayout
      variant="service-ai-chat"
      page="settings"
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="account"
          showTokens
          page="settings"
          onNavigate={onNavigate}
        />
      )}
    >
      <RbacModuleWidget variant="subject-me-account-settings" showTokens />
    </HostModuleLayout>
  );
}
