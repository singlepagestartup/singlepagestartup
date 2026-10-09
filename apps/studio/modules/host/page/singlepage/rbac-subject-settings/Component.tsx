import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function ProfileDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subject-settings"
      data-ds-route="/rbac/subject/settings"
    >
      <HostNavbarDefault activeHref="/rbac/subject/settings" isAuthenticated />
      <RbacModuleWidget variant="subject-me-account-settings" />
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
