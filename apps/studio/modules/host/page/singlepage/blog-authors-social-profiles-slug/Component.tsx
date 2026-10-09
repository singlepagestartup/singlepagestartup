import { Component as BlogModuleArticle } from "../../../../blog/article";
import { Component as SocialModuleProfile } from "../../../../social/profile";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function SocialProfileFindByIdOverviewAuthor() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.blog-authors-social-profiles-slug"
    >
      <HostNavbarDefault />
      <SocialModuleProfile
        variant="author-find-by-id-overview-default"
        articles={Array.from({ length: 2 }, (_, index) => (
          <BlogModuleArticle
            key={`author-article-${index}`}
            variant="row"
            href="/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default"
            target="_top"
          />
        ))}
      />
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
