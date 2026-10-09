import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { FooterCompact } from "../../../../website-builder/widget/singlepage/footer-compact/Component";
import { HostWidgetDefault } from "../../../widget/singlepage/default/Component";

export function BlogFindByIdArticleOverview() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.blog-articles-blog-articles-slug"
      data-ds-route="/blog/articles/[blog.articles.slug]"
    >
      <HostNavbarDefault />
      <HostWidgetDefault />
      <FooterCompact />
    </main>
  );
}
