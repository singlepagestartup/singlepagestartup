import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { SectionStack } from "../../../../../../workspace/design/singlepage/interface-kit/SectionStack";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { ContentPageHeader } from "../../../../../website-builder/models/widget/singlepage/content-page-header/Component";
import { ArticleFindFeatured } from "../../../../../blog/models/widget/singlepage/article-find-featured/Component";
import { ArticleFindCardDefault } from "../../../../../blog/models/widget/singlepage/article-find-card-default/Component";
import { TagFindButton } from "../../../../../blog/models/widget/singlepage/tag-find-button/Component";

export function BlogFindArticleCard() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.blog"
    >
      <HostNavbarDefault />
      <SectionStack>
        <ContentPageHeader
          compact
          eyebrow="Blog"
          title="Insights, Guides & Updates"
          description="Tutorials, engineering deep-dives, case studies, and product announcements from the team."
        />
        <ArticleFindFeatured compact />
        <ArticleFindCardDefault />
        <TagFindButton />
      </SectionStack>
      <FooterCompact />
    </main>
  );
}
