import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleWidget } from "../../../../rbac/widget/index";

export function ProfileDefault({
  variant = "rbac-module-subject-me-settings",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="website"
        activeHref="/rbac/subject/settings"
        signedIn
        footer="compact"
      >
        <main
          className="min-w-0"
          data-ds-page="host.page.rbac-module-subject-me-settings"
          data-ds-route="/rbac/subject/settings"
        >
          <RbacModuleWidget variant="subject-me-profile-settings" />
        </main>
      </Layout>
    </div>
  );
}
