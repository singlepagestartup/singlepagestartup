import type {
  IComponentProps,
  ArticleFindCardDefaultArticle,
} from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function ArticleFindCardDefault(props: IComponentProps = {}) {
  const p = { ...defaultArticleFindCardDefaultProps, ...props };
  return (
    <ClientComponent
      categories={p.categories}
      articles={p.articles}
      embedded={props.embedded}
      title={props.title}
      description={props.description}
    />
  );
}
const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default";
const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const marcusAvatar =
  "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
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
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
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
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
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
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
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
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
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
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
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
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
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

import type { BlogCategoryTab } from "./interface";
