import { Component as RbacModuleIdentity } from "../../../../rbac/identity";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function RbacIdentityResetPasswordDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subject-authentication-reset-password"
    >
      <HostNavbarDefault activeHref="/reset-password" />
      <section className="w-full py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <RbacModuleIdentity variant="reset-password-default" />
        </div>
      </section>
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
