import { IdentityLoginDefault } from "../../../../rbac/identity/singlepage/login-default/Component";
import { FooterCompact } from "../../../../website-builder/widget/singlepage/footer-compact/Component";
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
      <IdentityLoginDefault
        submitHref="/blog/authors/[social.profiles.slug]"
        submitStoryHref={authorProfileStoryHref}
      />
      <FooterCompact />
    </main>
  );
}
