import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { ArticleOverviewDefaultWidget } from "../../../../../blog/models/widget/singlepage/article-overview-default/Component";

export function BlogFindByIdArticleOverview() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.blog-articles-blog-articles-slug"
      data-ds-route="/blog/articles/[blog.articles.slug]"
    >
      <HostNavbarDefault />
      <ArticleOverviewDefaultWidget />
      <FooterCompact />
    </main>
  );
}
