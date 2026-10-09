import { Component as RbacModuleIdentity } from "../../../../rbac/identity";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";

const authorProfileStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-authors-social-profiles-slug--default";

export function RbacSubjectAuthenticationSelectMethod() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.rbac-subject-authentication-select-method"
      data-ds-route="/rbac/subject/authentication/select-method"
    >
      <HostNavbarDefault activeHref="/rbac/subject/authentication/select-method" />
      <RbacModuleIdentity
        variant="login-default"
        submitHref="/blog/authors/[social.profiles.slug]"
        submitStoryHref={authorProfileStoryHref}
      />
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
