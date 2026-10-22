import type {
  IComponentProps,
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
} from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export type {
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
  ArticleDetailProps,
} from "./interface";
export function ArticleDetail(props: IComponentProps = {}) {
  const p = { ...defaultArticleDetailProps, ...props };
  return (
    <ClientComponent
      slug={p.slug}
      category={p.category}
      tags={p.tags}
      title={p.title}
      authorName={p.authorName}
      authorSlug={p.authorSlug}
      authorRole={p.authorRole}
      authorAvatar={p.authorAvatar}
      date={p.date}
      readTime={p.readTime}
      totalComments={p.totalComments}
      content={p.content}
      pinnedProducts={p.pinnedProducts}
      comments={p.comments}
      relatedArticles={p.relatedArticles}
      cover={p.cover}
      tagsCard={p.tagsCard}
      widgets={p.widgets}
    />
  );
}

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
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
