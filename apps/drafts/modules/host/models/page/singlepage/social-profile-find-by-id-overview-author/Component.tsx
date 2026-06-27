import { ProfileAuthorFindByIdOverviewDefault } from "../../../../../social/models/profile/singlepage/author-find-by-id-overview-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function SocialProfileFindByIdOverviewAuthor() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.social-profile-find-by-id-overview-author"
    >
      <HostNavbarDefault />
      <ProfileAuthorFindByIdOverviewDefault />
      <FooterCompact />
    </main>
  );
}
