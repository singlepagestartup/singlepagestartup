import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as HostModuleWidget } from "../../../widget";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function BlogFindByIdArticleOverview() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.blog-articles-blog-articles-slug"
      data-ds-route="/blog/articles/[blog.articles.slug]"
    >
      <HostNavbarDefault />
      <HostModuleWidget variant="default" />
      <WebsiteBuilderModuleWidget variant="footer-compact" />
    </main>
  );
}
