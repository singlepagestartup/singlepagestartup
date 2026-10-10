import { Component as BlogModuleArticle } from "../../../article";
import { type CategoryButtonDefaultProps } from "../../../category";
import { useCallback, useState } from "react";
import {
  Button,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  CollectionToolbar,
  CollectionPagination,
} from "../../../../../workspace/design/singlepage/interface-kit/Collections";

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

export interface ArticleFindCardDefaultArticle {
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
      coverImage: new URL(
        "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
        import.meta.url,
      ).href,
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
      coverImage: new URL(
        "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
        import.meta.url,
      ).href,
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
      coverImage: new URL(
        "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
        import.meta.url,
      ).href,
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
      coverImage: new URL(
        "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
        import.meta.url,
      ).href,
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
      coverImage: new URL(
        "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
        import.meta.url,
      ).href,
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
      coverImage: new URL(
        "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
        import.meta.url,
      ).href,
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const chooseCategory = useCallback((slug: string) => {
    setCategory(slug);
    setPage(1);
  }, []);
  const search = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);
  const filtered = articles.filter(
    (article) =>
      (category === "all" || article.category === category) &&
      `${article.title} ${article.excerpt} ${article.authorName}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const activePage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / pageSize)),
  );
  const visible = filtered.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <section
      aria-label="Article collection"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      data-ds-block="blog.widget.article-find-card-default"
      data-ds-imports="blog.category.button-default blog.article.card"
      data-ds-layer="singlepage"
    >
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        All articles
      </h2>
      <CollectionToolbar
        categories={categories}
        category={category}
        onCategoryChange={chooseCategory}
        query={query}
        onQueryChange={search}
        searchLabel="Search articles"
      />
      <p className={`mb-6 text-sm ${kit.muted}`} aria-live="polite">
        {filtered.length} articles
      </p>
      {filtered.length > 0 ? (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((article) => (
            <BlogModuleArticle
              variant="card"
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
      ) : (
        <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-8 text-center">
          <h3 className="text-2xl font-semibold">No matching articles</h3>
          <p className="mt-3 text-sm text-[var(--workspace-brand-muted)]">
            Try another search or choose a different category.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <CollectionPagination
        page={activePage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
      />
    </section>
  );
}
