import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock,
  MessageSquare,
  Share2,
  ShoppingCart,
} from "lucide-react";

import { ProfileCompact } from "../../../../../social/models/profile/singlepage/compact/Component";
import { ContentRich } from "../../../../../website-builder/models/widget/singlepage/content-rich/Component";
import { ProfileArticleFindByIdCommentFormDefault } from "../../../../../social/models/profile/singlepage/article-find-by-id-comment-form-default/Component";
import { ProfileArticleFindByIdCommentFindDefault } from "../../../../../social/models/widget/singlepage/profile-article-find-by-id-comment-find-default/Component";
import { ProfileCard } from "../../../../../social/models/profile/singlepage/card/Component";
import { ProductPinned } from "../../../../../ecommerce/models/product/singlepage/pinned/Component";
import { ArticleRelatedDefault } from "../related-default/Component";
import { ArticleFindByIdTagFind } from "../../../widget/singlepage/article-find-by-id-tag-find-default/Component";
import { TagButtonDefault } from "../../../tag/singlepage/button-default/Component";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-find-by-id-article-overview--default";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

interface BlogCommentData {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies?: BlogCommentData[];
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
}

interface PinnedProduct {
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

export type ArticleDetailProps = typeof defaultArticleDetailProps;

export function ArticleDetail(props?: Partial<ArticleDetailProps>) {
  const {
    slug,
    category,
    tags,
    title,
    authorName,
    authorSlug,
    authorRole,
    authorAvatar,
    date,
    readTime,
    totalComments,
    content,
    pinnedProducts,
    comments,
    relatedArticles,
  } = { ...defaultArticleDetailProps, ...props };

  return (
    <div
      className="w-full"
      data-ds-block="blog.article.detail"
      data-ds-imports="blog.tag.button-default blog.article.related-default social.profile.article-find-by-id-comment-form-default social.widget.profile-article-find-by-id-comment-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
          {/* Left column */}
          <div>
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
              <a href="/blog" className="transition hover:text-slate-600">
                Blog
              </a>
              <ChevronRight className="h-3 w-3" />
              <span className="capitalize text-slate-600">{category}</span>
            </nav>

            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                {category}
              </span>
              {tags.map((tag) => (
                <TagButtonDefault
                  key={tag}
                  label={tag}
                  href={`/blog/tags/${tag}`}
                />
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl tracking-tight text-slate-900 lg:text-4xl">
              {title}
            </h1>

            {/* Author line — social.profile.compact */}
            <div className="mt-5 flex items-center gap-4 border-b border-slate-200 pb-6">
              <ProfileCompact
                name={authorName}
                role={authorRole}
                avatar={authorAvatar}
                href={`/blog/authors/${authorSlug}`}
              />
              <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                <span>{date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readTime}
                </span>
              </div>
            </div>

            {/* Content — website-builder.widget.content-rich */}
            <div className="mt-8">
              <ContentRich content={content} />
            </div>

            {/* Share bar */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Share:</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                >
                  <Share2 className="h-3 w-3" />
                  Copy link
                </button>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
              >
                <Bookmark className="h-3 w-3" />
                Save
              </button>
            </div>

            {/* Comments */}
            <section className="mt-10">
              <div className="mb-6 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm text-slate-900">
                  Comments ({totalComments})
                </h2>
              </div>

              {/* Comment form — social.profile.article-find-by-id-comment-form-default */}
              <div className="mb-8">
                <ProfileArticleFindByIdCommentFormDefault />
              </div>

              {/* Comments list — social.widget.profile-article-find-by-id-comment-find-default */}
              <ProfileArticleFindByIdCommentFindDefault comments={comments} />
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6 lg:mt-0">
            {/* Pinned Products */}
            {pinnedProducts.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-[#eaf0f7] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm text-slate-900">Related Products</h3>
                </div>
                <div className="space-y-3">
                  {pinnedProducts.map((product) => (
                    <ProductPinned
                      key={product.id}
                      slug={product.slug}
                      title={product.title}
                      shortDescription={product.shortDescription}
                      priceLabel={product.priceLabel}
                      category={product.category}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Author card — social.profile.card */}
            <ProfileCard
              name={authorName}
              role={authorRole}
              avatar={authorAvatar}
              href={`/blog/authors/${authorSlug}`}
            />

            {/* Tags — blog.widget.article-find-by-id-tag-find-default */}
            <ArticleFindByIdTagFind tags={tags} />

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
                  Related Articles
                </p>
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
              </div>
            )}

            {/* Back to blog */}
            <a
              href="/blog"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all articles
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
