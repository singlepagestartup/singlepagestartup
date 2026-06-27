import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { ContentPageHeader } from "../../../../../website-builder/models/widget/singlepage/content-page-header/Component";
import { ArticleFindFeatured } from "../../../../../blog/models/widget/singlepage/article-find-featured/Component";
import { ArticleFindCardDefault } from "../../../../../blog/models/widget/singlepage/article-find-card-default/Component";
import { TagFindButton } from "../../../../../blog/models/widget/singlepage/tag-find-button/Component";

export function BlogFindArticleCard() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.blog-find-article-card"
    >
      <HostNavbarDefault />
      <ContentPageHeader
        eyebrow="Blog"
        title="Insights, Guides & Updates"
        description="Tutorials, engineering deep-dives, case studies, and product announcements from the team."
      />
      <ArticleFindFeatured />
      <ArticleFindCardDefault />
      <TagFindButton />
      <FooterCompact />
    </main>
  );
}
