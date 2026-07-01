import { IdentityLoginDefault } from "../../../../../rbac/models/identity/singlepage/login-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacSubjectAuthenticationSelectMethod() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-subject-authentication-select-method"
      data-ds-route="/rbac/subject/authentication/select-method"
    >
      <HostNavbarDefault activeHref="/rbac/subject/authentication/select-method" />
      <IdentityLoginDefault />
      <FooterCompact />
    </main>
  );
}
