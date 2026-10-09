import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

export function BlogFindArticleCard() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.blog"
    >
      <HostNavbarDefault />
      <SectionStack>
        <WebsiteBuilderModuleWidget
          variant="content-page-header"
          compact
          eyebrow="Blog"
          title="Insights, Guides & Updates"
          description="Tutorials, engineering deep-dives, case studies, and product announcements from the team."
        />
        <BlogModuleWidget variant="article-find-featured" compact />
        <BlogModuleWidget variant="article-find-card-default" />
        <BlogModuleWidget variant="tag-find-button" />
      </SectionStack>
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
