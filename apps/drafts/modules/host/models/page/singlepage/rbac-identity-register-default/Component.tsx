import { IdentityRegisterDefault } from "../../../../../rbac/models/identity/singlepage/register-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacIdentityRegisterDefault() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-identity-register-default"
    >
      <HostNavbarDefault activeHref="/register" />
      <section className="w-full py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <IdentityRegisterDefault />
        </div>
      </section>
      <FooterCompact />
    </main>
  );
}
