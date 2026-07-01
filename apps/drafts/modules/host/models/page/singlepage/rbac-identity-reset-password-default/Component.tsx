import { IdentityResetPasswordDefault } from "../../../../../rbac/models/identity/singlepage/reset-password-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacIdentityResetPasswordDefault() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-identity-reset-password-default"
    >
      <HostNavbarDefault activeHref="/reset-password" />
      <section className="w-full py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <IdentityResetPasswordDefault />
        </div>
      </section>
      <FooterCompact />
    </main>
  );
}
