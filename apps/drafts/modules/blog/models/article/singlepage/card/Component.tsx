/**
 * blog.article.card
 *
 * Vertical blog card: cover image, category + date, title, truncated excerpt,
 * footer with author byline (social.profile.byline) + comment count + read time.
 * Root element is an anchor linking to /blog/articles/<slug>.
 *
 * Owned by the blog module (model: article). Display components such as
 * ArticleFindCardDefault composes this via import instead of re-implementing the
 * markup.
 *
 * Source: BlogListPage.tsx grid card (lines 146-206).
 */

import { Clock, MessageSquare } from "lucide-react";
import { ProfileByline } from "../../../../../social/models/profile/singlepage/byline/Component";

type ArticleCardTarget = "_blank" | "_parent" | "_self" | "_top";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultArticleCardProps = {
  href: undefined as string | undefined,
  slug: "how-to-choose",
  coverImage:
    "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  category: "guides",
  date: "Feb 18, 2026",
  title: "How to Choose the Right Plan for Your Business",
  excerpt:
    "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
  authorName: "Sarah Kim",
  authorAvatar: sarahAvatar,
  authorSlug: "sarah-kim",
  commentCount: 3,
  readTime: "7 min read",
  target: undefined as ArticleCardTarget | undefined,
};

export type ArticleCardProps = typeof defaultArticleCardProps;

export function ArticleCard(props?: Partial<ArticleCardProps>) {
  const {
    href,
    slug,
    coverImage,
    category,
    date,
    title,
    excerpt,
    authorName,
    authorAvatar,
    commentCount,
    readTime,
    target,
  } = { ...defaultArticleCardProps, ...props };
  const articleHref = href ?? `/blog/articles/${slug}`;

  return (
    <a
      href={articleHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
      data-ds-block="blog.article.card"
      data-ds-layer="singlepage"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {category}
          </span>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
        <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
          {title}
        </h3>
        <p className="mt-1.5 flex-1 text-sm text-slate-500">
          {excerpt.length > 120 ? excerpt.slice(0, 120) + "..." : excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <ProfileByline
            name={authorName}
            avatar={authorAvatar}
            href={null}
            size="xs"
          />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {readTime}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
