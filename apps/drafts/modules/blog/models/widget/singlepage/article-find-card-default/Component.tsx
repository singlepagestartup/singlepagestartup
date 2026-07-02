import { Search } from "lucide-react";
import { ArticleCard } from "../../../article/singlepage/card/Component";
import {
  CategoryButtonDefault,
  type CategoryButtonDefaultProps,
} from "../../../category/singlepage/button-default/Component";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const marcusAvatar =
  "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

type BlogCategoryTab = Pick<
  CategoryButtonDefaultProps,
  "slug" | "label" | "count"
>;

interface ArticleFindCardDefaultArticle {
  href?: string;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  date: string;
  readTime: string;
  commentCount: number;
  authorName: string;
  authorSlug: string;
  authorAvatar: string;
}

export const defaultArticleFindCardDefaultProps = {
  categories: [
    { slug: "all", label: "All Posts", count: 6 },
    { slug: "guides", label: "Guides", count: 2 },
    { slug: "engineering", label: "Engineering", count: 2 },
    { slug: "product", label: "Product", count: 1 },
    { slug: "case-study", label: "Case Studies", count: 1 },
  ] as BlogCategoryTab[],
  articles: [
    {
      id: "art-1",
      slug: "how-to-choose",
      title: "How to Choose the Right Plan for Your Business",
      excerpt:
        "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
      coverImage:
        "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "guides",
      date: "Feb 18, 2026",
      readTime: "7 min read",
      commentCount: 3,
      authorName: "Sarah Kim",
      authorSlug: "sarah-kim",
      authorAvatar: sarahAvatar,
    },
    {
      id: "art-2",
      slug: "new-features",
      title: "New Features in 2026: Everything You Need to Know",
      excerpt:
        "A rundown of the most exciting features shipped in the latest release — from the AI Agent module to the redesigned admin panel.",
      coverImage:
        "https://images.unsplash.com/photo-1759884247160-27b8465544b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwb2ZmaWNlJTIwd2hpdGVib2FyZCUyMHBsYW5uaW5nfGVufDF8fHx8MTc3MTcxNTg4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "product",
      date: "Feb 14, 2026",
      readTime: "6 min read",
      commentCount: 4,
      authorName: "James Carter",
      authorSlug: "james-carter",
      authorAvatar: jamesAvatar,
    },
    {
      id: "art-3",
      slug: "success-story",
      title: "How NovaBridge Scaled to 100K Users in 6 Months",
      excerpt:
        "A deep dive into how NovaBridge used our modular platform to go from prototype to 100,000 active users in half a year.",
      coverImage:
        "https://images.unsplash.com/photo-1582005450386-52b25f82d9bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3RhcnR1cCUyMHRlYW0lMjBtZWV0aW5nfGVufDF8fHx8MTc3MTcxNTM2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "case-study",
      date: "Feb 8, 2026",
      readTime: "9 min read",
      commentCount: 5,
      authorName: "Sarah Kim",
      authorSlug: "sarah-kim",
      authorAvatar: sarahAvatar,
    },
    {
      id: "art-4",
      slug: "getting-started",
      title: "Getting Started: From Zero to Your First Module",
      excerpt:
        "Step-by-step guide to setting up your first project, configuring a module, and creating your first entity records in under 10 minutes.",
      coverImage:
        "https://images.unsplash.com/photo-1618410325698-018bb3eb2318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBsYXB0b3AlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzcxNzE1MzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "guides",
      date: "Feb 3, 2026",
      readTime: "5 min read",
      commentCount: 2,
      authorName: "Marcus Webb",
      authorSlug: "marcus-webb",
      authorAvatar: marcusAvatar,
    },
    {
      id: "art-5",
      slug: "enterprise-security",
      title: "Enterprise Security: How We Protect Your Data",
      excerpt:
        "A deep dive into our enterprise-grade security features, from RBAC and SSO to encryption at rest and audit logging.",
      coverImage:
        "https://images.unsplash.com/photo-1639503547276-90230c4a4198?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMHNoaWVsZCUyMGRpZ2l0YWwlMjBwcm90ZWN0aW9ufGVufDF8fHx8MTc3MTcxNTg4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "engineering",
      date: "Jan 28, 2026",
      readTime: "10 min read",
      commentCount: 2,
      authorName: "James Carter",
      authorSlug: "james-carter",
      authorAvatar: jamesAvatar,
    },
    {
      id: "art-6",
      slug: "api-integration",
      title: "API Integration Tutorial: Connecting External Services",
      excerpt:
        "Step-by-step guide to integrating with our REST API, setting up webhooks, and building custom automation workflows.",
      coverImage:
        "https://images.unsplash.com/photo-1561347981-969c80cf4463?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSRVNUJTIwQVBJJTIwY29kZSUyMHByb2dyYW1taW5nfGVufDF8fHx8MTc3MTcxNTg4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "engineering",
      date: "Jan 22, 2026",
      readTime: "11 min read",
      commentCount: 5,
      authorName: "Marcus Webb",
      authorSlug: "marcus-webb",
      authorAvatar: marcusAvatar,
    },
  ] as ArticleFindCardDefaultArticle[],
};

export type ArticleFindCardDefaultProps =
  typeof defaultArticleFindCardDefaultProps;

export function ArticleFindCardDefault(
  props?: Partial<ArticleFindCardDefaultProps>,
) {
  const { categories, articles } = {
    ...defaultArticleFindCardDefaultProps,
    ...props,
  };

  return (
    <div
      className="mx-auto max-w-6xl px-6 pb-4"
      data-ds-block="blog.widget.article-find-card-default"
      data-ds-imports="blog.category.button-default blog.article.card"
      data-ds-layer="singlepage"
    >
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((category, index) => (
            <CategoryButtonDefault
              key={category.slug}
              slug={category.slug}
              label={category.label}
              count={category.count}
              isActive={index === 0}
            />
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles..."
            readOnly
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            href={article.href ?? articleOverviewStoryHref}
            slug={article.slug}
            coverImage={article.coverImage}
            category={article.category}
            date={article.date}
            title={article.title}
            excerpt={article.excerpt}
            authorName={article.authorName}
            authorAvatar={article.authorAvatar}
            authorSlug={article.authorSlug}
            commentCount={article.commentCount}
            readTime={article.readTime}
            target="_top"
          />
        ))}
      </div>
    </div>
  );
}
