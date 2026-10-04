import { ProfileAuthorFindByIdOverviewDefault } from "../../../../../social/models/profile/singlepage/author-find-by-id-overview-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function SocialProfileFindByIdOverviewAuthor() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.blog-authors-social-profiles-slug"
    >
      <HostNavbarDefault />
      <ProfileAuthorFindByIdOverviewDefault />
      <FooterCompact />
    </main>
  );
}
