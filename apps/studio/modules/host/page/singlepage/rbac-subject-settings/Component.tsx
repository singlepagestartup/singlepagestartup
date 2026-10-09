import { SubjectMeAccountSettings } from "../../../../rbac/widget/singlepage/subject-me-account-settings/Component";
import { FooterCompact } from "../../../../website-builder/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function ProfileDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subject-settings"
      data-ds-route="/rbac/subject/settings"
    >
      <HostNavbarDefault activeHref="/rbac/subject/settings" isAuthenticated />
      <SubjectMeAccountSettings />
      <FooterCompact />
    </main>
  );
}
