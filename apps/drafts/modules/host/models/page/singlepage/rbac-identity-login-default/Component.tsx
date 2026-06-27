import { IdentityLoginDefault } from "../../../../../rbac/models/identity/singlepage/login-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacIdentityLoginDefault() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      data-ds-page="host.page.rbac-identity-login-default"
    >
      <HostNavbarDefault activeHref="/login" />
      <section className="w-full py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <IdentityLoginDefault
            forgotStoryHref="/?path=/story/modules-host-models-page-singlepage-rbac-identity-password-reset-default--default"
            registerStoryHref="/?path=/story/modules-host-models-page-singlepage-rbac-identity-register-default--default"
          />
        </div>
      </section>
      <FooterCompact />
    </main>
  );
}
