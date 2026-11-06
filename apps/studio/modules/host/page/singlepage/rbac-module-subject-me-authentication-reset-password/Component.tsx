import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export function RbacSubjectAuthenticationResetPassword({
  variant = "rbac-module-subject-me-authentication-reset-password",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" activeHref="/reset-password" footer="compact">
        <main
          className="min-w-0"
          data-ds-page="host.page.rbac-module-subject-me-authentication-reset-password"
        >
          <section className="w-full py-12">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <RbacModuleSubject variant="me-authentication-email-and-password-reset-password-form-default" />
            </div>
          </section>
        </main>
      </Layout>
    </div>
  );
}
