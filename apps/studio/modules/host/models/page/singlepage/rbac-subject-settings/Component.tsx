import { SubjectMeAccountSettings } from "../../../../../rbac/models/widget/singlepage/subject-me-account-settings/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function ProfileDefault() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-subject-settings"
      data-ds-route="/rbac/subject/settings"
    >
      <HostNavbarDefault activeHref="/rbac/subject/settings" isAuthenticated />
      <SubjectMeAccountSettings />
      <FooterCompact />
    </main>
  );
}
