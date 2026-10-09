import { Component as HostModuleLayout } from "../../../layout";
import { Component as RbacModuleIdentity } from "../../../../rbac/identity";

export function RbacIdentityResetPasswordDefault() {
  return (
    <HostModuleLayout
      variant="website"
      activeHref="/reset-password"
      footer="compact"
    >
      <main
        className="min-w-0"
        data-ds-page="host.page.rbac-subject-authentication-reset-password"
      >
        <section className="w-full py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <RbacModuleIdentity variant="reset-password-default" />
          </div>
        </section>
      </main>
    </HostModuleLayout>
  );
}
