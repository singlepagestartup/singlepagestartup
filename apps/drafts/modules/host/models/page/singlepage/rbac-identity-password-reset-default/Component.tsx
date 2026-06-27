import { IdentityPasswordResetDefault } from "../../../../../rbac/models/identity/singlepage/password-reset-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacIdentityPasswordResetDefault() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-identity-password-reset-default"
    >
      <HostNavbarDefault activeHref="/forgot-password" />
      <section className="w-full py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <IdentityPasswordResetDefault backStoryHref="/?path=/story/modules-host-models-page-singlepage-rbac-identity-login-default--default" />
        </div>
      </section>
      <FooterCompact />
    </main>
  );
}
