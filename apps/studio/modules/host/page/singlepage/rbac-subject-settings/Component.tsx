import { Component as HostModuleLayout } from "../../../layout";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";

export function ProfileDefault() {
  return (
    <HostModuleLayout
      variant="website"
      activeHref="/rbac/subject/settings"
      signedIn
      footer="compact"
    >
      <main
        className="min-w-0"
        data-ds-page="host.page.rbac-subject-settings"
        data-ds-route="/rbac/subject/settings"
      >
        <RbacModuleWidget variant="subject-me-account-settings" />
      </main>
    </HostModuleLayout>
  );
}
