import { useState, type ReactNode } from "react";
import {
  Button,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  MessageSquare,
  Share2,
} from "../../../../../workspace/utils/components/ModuleIcons";

import { ProfileCompact } from "../../../../social/profile/singlepage/compact/Component";
import { ContentRich } from "../../../../website-builder/widget/singlepage/content-rich/Component";
import { ProfileArticleFindByIdCommentFormDefault } from "../../../../social/profile/singlepage/article-find-by-id-comment-form-default/Component";
import { ProfileArticleFindByIdCommentFindDefault } from "../../../../social/widget/singlepage/profile-article-find-by-id-comment-find-default/Component";
import { ProfileCard } from "../../../../social/profile/singlepage/card/Component";
import { ProductPinned } from "../../../../ecommerce/product/singlepage/pinned/Component";
import { ArticleRelatedDefault } from "../related-default/Component";
import { ArticleFindByIdTagFind } from "../../../widget/singlepage/article-find-by-id-tag-find-default/Component";
import { TagButtonDefault } from "../../../tag/singlepage/button-default/Component";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default";

const authorOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-authors-social-profiles-slug--default";

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-products-ecommerce-products-slug--default";

const blogIndexStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog--default";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export interface BlogCommentData {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies?: BlogCommentData[];
}

export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
}

export interface PinnedProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  price: string;
  priceLabel: string;
  category: string;
}

export const defaultArticleDetailProps = {
  slug: "how-to-choose",
  category: "guides",
  tags: ["pricing", "plans", "getting-started"],
  title: "How to Choose the Right Plan for Your Business",
  authorName: "Sarah Kim",
  authorSlug: "sarah-kim",
  authorRole: "Head of Product",
  authorAvatar: sarahAvatar,
  date: "Feb 18, 2026",
  readTime: "7 min read",
  totalComments: 3,
  content: `
<p>Choosing the right subscription plan can feel overwhelming when every tier offers a different mix of features. This guide breaks down our approach to pricing and helps you make an informed decision.</p>

<h2>Understanding Your Needs</h2>
<p>Before comparing plans, take a step back and assess what your team actually needs. Consider the number of active projects, the modules you'll rely on most, and your expected growth over the next 12 months.</p>

<blockquote>The best plan isn't always the most expensive one — it's the one that grows with you without paying for features you'll never use.</blockquote>

<h2>Comparing Feature Sets</h2>
<p>Our three tiers — <strong>Free</strong>, <strong>Startup</strong>, and <strong>Enterprise</strong> — are designed for different stages of product maturity. The Free tier gives you access to 3 modules and 1 project, perfect for prototyping and personal use.</p>

<p>The Startup plan unlocks all 15 modules, 5 projects, custom domains, and API access. For most growing teams, this is the sweet spot — you get everything you need without the overhead of enterprise-grade compliance features.</p>

<h2>When to Upgrade</h2>
<p>There are a few clear signals that it's time to move up:</p>
<ul>
<li>You're hitting project or storage limits regularly</li>
<li>You need SSO or advanced RBAC controls</li>
<li>Your team has grown beyond 10 active contributors</li>
<li>You require an SLA guarantee for production workloads</li>
</ul>

<h3>Cost Optimization Tips</h3>
<p>Annual billing saves 20% across all paid tiers. If you're committing to a year, it's almost always worth it. You can also start with Startup and upgrade individual features through add-ons before jumping to the full Enterprise plan.</p>

<p>We also offer a 14-day free trial on all paid plans, so you can test everything before making a commitment.</p>
  `,
  pinnedProducts: [
    {
      id: "srv-consulting",
      slug: "consulting",
      title: "Technical Consulting",
      shortDescription:
        "Expert guidance on architecture, scaling, and technology strategy",
      price: "$2,500",
      priceLabel: "from $2,500",
      category: "consulting",
    },
    {
      id: "srv-saas",
      slug: "saas-development",
      title: "SaaS Development",
      shortDescription:
        "Full-cycle SaaS product development from idea to launch",
      price: "$15,000",
      priceLabel: "from $15,000",
      category: "development",
    },
  ] as PinnedProduct[],
  comments: [
    {
      id: "c1",
      author: "Alex Rivera",
      avatar: "",
      date: "Feb 19, 2026",
      text: "Great breakdown! We were on the fence between Startup and Enterprise, but this made it clear that Startup covers everything we need right now.",
      likes: 12,
      replies: [
        {
          id: "c1r1",
          author: "Sarah Kim",
          avatar: sarahAvatar,
          date: "Feb 19, 2026",
          text: "Glad it helped, Alex! You can always upgrade later if your needs change.",
          likes: 4,
        },
      ],
    },
    {
      id: "c2",
      author: "Nina Patel",
      avatar: "",
      date: "Feb 20, 2026",
      text: "The annual billing tip saved us quite a bit. Wish I had read this earlier!",
      likes: 8,
    },
  ] as BlogCommentData[],
  relatedArticles: [
    {
      id: "art-4",
      slug: "getting-started",
      title: "Getting Started: From Zero to Your First Module",
      category: "guides",
      date: "Feb 3, 2026",
      readTime: "5 min read",
    },
    {
      id: "art-2",
      slug: "new-features",
      title: "New Features in 2026: Everything You Need to Know",
      category: "product",
      date: "Feb 14, 2026",
      readTime: "6 min read",
    },
    {
      id: "art-3",
      slug: "success-story",
      title: "How NovaBridge Scaled to 100K Users in 6 Months",
      category: "case-study",
      date: "Feb 8, 2026",
      readTime: "9 min read",
    },
  ] as RelatedArticle[],
};

export type ArticleDetailProps = typeof defaultArticleDetailProps & {
  cover?: ReactNode;
};

export function ArticleDetail(props?: Partial<ArticleDetailProps>) {
  const {
    slug,
    category,
    tags,
    title,
    authorName,
    authorRole,
    authorAvatar,
    date,
    readTime,
    totalComments,
    content,
    pinnedProducts,
    comments,
    relatedArticles,
    cover,
  } = { ...defaultArticleDetailProps, ...props };
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(`/blog/articles/${slug}`, window.location.origin).href,
      );
      setCopyStatus("Article link copied.");
    } catch {
      setCopyStatus("Copy is unavailable in this preview.");
    }
  }
  return (
    <div
      className="w-full min-w-0"
      data-ds-block="blog.article.detail"
      data-ds-imports="blog.tag.button-default blog.article.related-default social.profile.article-find-by-id-comment-form-default social.widget.profile-article-find-by-id-comment-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav
          aria-label="Article breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--workspace-brand-muted)]"
        >
          <a
            href={blogIndexStoryHref}
            target="_top"
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl hover:text-[var(--workspace-brand-foreground)] ${kit.focus}`}
          >
            <ArrowLeft className="size-5" />
            All articles
          </a>
          <ChevronRight className="size-5" />
          <span>{category}</span>
        </nav>
        <header
          className={`grid min-w-0 gap-4 ${cover ? "lg:grid-cols-2" : ""}`}
        >
          <div className="flex min-w-0 flex-col justify-between gap-8 rounded-3xl bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)] sm:p-8 lg:p-10">
            <div>
              <span className="inline-flex rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-brand-on-accent)]">
                {category}
              </span>
              <h1 className="mt-6 break-words text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
                {title}
              </h1>
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-white/20 pt-5">
              <ProfileCompact
                inverse
                name={authorName}
                role={authorRole}
                avatar={authorAvatar}
                href={authorOverviewStoryHref}
                target="_top"
              />
              <div className="text-right text-xs leading-5 text-[var(--workspace-brand-muted-on-primary)]">
                <p>{date}</p>
                <p>{readTime}</p>
              </div>
            </div>
          </div>
          {cover && <div className="min-w-0">{cover}</div>}
        </header>
        <div className="grid min-w-0 items-start gap-6 pt-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="min-w-0 space-y-8">
            <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagButtonDefault
                    key={tag}
                    label={tag}
                    href={`/blog/tags/${tag}`}
                  />
                ))}
              </div>
              <ContentRich content={content} />
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] pt-6">
                <Button variant="secondary" onClick={copyLink}>
                  <Share2 className="size-5" />
                  Copy link
                </Button>
                <Button
                  variant="secondary"
                  aria-pressed={saved}
                  onClick={() => setSaved((value) => !value)}
                >
                  <Bookmark className="size-5" />
                  {saved ? "Saved in preview" : "Save article"}
                </Button>
              </div>
              <p
                aria-live="polite"
                className="mt-3 text-xs text-[var(--workspace-brand-muted)]"
              >
                {copyStatus ||
                  (saved ? "Saved locally for this preview session." : "")}
              </p>
            </div>
            <section
              aria-label="Article comments"
              className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8"
            >
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold tracking-tight">
                <MessageSquare className="size-6" />
                Comments{" "}
                <span className="text-base font-normal text-[var(--workspace-brand-muted)]">
                  {totalComments}
                </span>
              </h2>
              <div className="mb-8">
                <ProfileArticleFindByIdCommentFormDefault />
              </div>
              <ProfileArticleFindByIdCommentFindDefault comments={comments} />
            </section>
          </div>
          <aside aria-label="Related resources" className="min-w-0 space-y-6">
            <ProfileCard
              name={authorName}
              role={authorRole}
              avatar={authorAvatar}
              href={authorOverviewStoryHref}
              target="_top"
            />
            {pinnedProducts.length > 0 && (
              <section className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5">
                <h2 className="mb-4 text-lg font-semibold">Related products</h2>
                <div className="space-y-4">
                  {pinnedProducts.map((product) => (
                    <ProductPinned
                      key={product.id}
                      slug={product.slug}
                      title={product.title}
                      shortDescription={product.shortDescription}
                      priceLabel={product.priceLabel}
                      category={product.category}
                      href={productOverviewStoryHref}
                      target="_top"
                    />
                  ))}
                </div>
              </section>
            )}
            <ArticleFindByIdTagFind tags={tags} />
            {relatedArticles.length > 0 && (
              <section className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5">
                <h2 className="mb-4 text-lg font-semibold">Keep reading</h2>
                <div className="space-y-3">
                  {relatedArticles.map((rel) => (
                    <ArticleRelatedDefault
                      key={rel.id}
                      href={articleOverviewStoryHref}
                      slug={rel.slug}
                      category={rel.category}
                      title={rel.title}
                      date={rel.date}
                      readTime={rel.readTime}
                      target="_top"
                    />
                  ))}
                </div>
              </section>
            )}
            <a
              href={blogIndexStoryHref}
              target="_top"
              className={`${kit.secondary} w-full`}
            >
              <ArrowLeft className="size-5" />
              Back to all articles
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
