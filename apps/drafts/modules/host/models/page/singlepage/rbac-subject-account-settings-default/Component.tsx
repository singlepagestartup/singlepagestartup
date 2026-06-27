import { SubjectMeAccountSettings } from "../../../../../rbac/models/widget/singlepage/subject-me-account-settings/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacSubjectAccountSettingsDefault() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-subject-account-settings-default"
    >
      <HostNavbarDefault activeHref="/admin/settings/account" />
      <SubjectMeAccountSettings />
      <FooterCompact />
    </main>
  );
}
