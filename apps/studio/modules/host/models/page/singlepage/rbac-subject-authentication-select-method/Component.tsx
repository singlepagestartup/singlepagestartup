import { IdentityLoginDefault } from "../../../../../rbac/models/identity/singlepage/login-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

const authorProfileStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-authors-social-profiles-slug--default";

export function RbacSubjectAuthenticationSelectMethod() {
  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
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
