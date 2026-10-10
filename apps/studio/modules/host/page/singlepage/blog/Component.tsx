import { Component as HostModuleLayout } from "../../../layout";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

export function BlogFindArticleCard() {
  return (
    <HostModuleLayout variant="website" footer="compact">
      <main className="min-w-0" data-ds-page="host.page.blog">
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
      </main>
    </HostModuleLayout>
  );
}
