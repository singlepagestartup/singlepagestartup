/**
 * blog.article.row
 *
 * Horizontal article card: cover image on the left (sm:w-56), content on the
 * right with category chip + tags, title, excerpt, date + read time + comment
 * count. Root element is an anchor linking to /blog/articles/<slug>.
 *
 * Owned by the blog module (model: article). Higher-level compositions, such
 * as social.profile.author-find-by-id-overview-default, import this row instead
 * of re-implementing article markup.
 *
 * Source: AuthorPage.tsx AuthorArticleCard (lines 82-136).
 */

import { Clock, MessageSquare } from "lucide-react";

type ArticleRowTarget = "_blank" | "_parent" | "_self" | "_top";

const defaultCover =
  "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultArticleRowProps = {
  href: undefined as string | undefined,
  slug: "how-to-choose",
  coverImage: defaultCover,
  category: "guides",
  tags: ["pricing", "plans", "getting-started"],
  title: "How to Choose the Right Plan for Your Business",
  excerpt:
    "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
  date: "Feb 18, 2026",
  readTime: "7 min read",
  commentCount: 3,
  target: undefined as ArticleRowTarget | undefined,
};

export type ArticleRowProps = typeof defaultArticleRowProps;

export function ArticleRow(props?: Partial<ArticleRowProps>) {
  const {
    href,
    slug,
    coverImage,
    category,
    tags,
    title,
    excerpt,
    date,
    readTime,
    commentCount,
    target,
  } = { ...defaultArticleRowProps, ...props };
  const articleHref = href ?? `/blog/articles/${slug}`;

  return (
    <a
      href={articleHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm sm:flex-row"
      data-ds-block="blog.article.row"
      data-ds-layer="singlepage"
    >
      {/* Cover */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-auto sm:w-56">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {category}
          </span>
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>
        <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{excerpt}</p>
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-slate-400">
          <span>{date}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readTime}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </span>
        </div>
      </div>
    </a>
  );
}
