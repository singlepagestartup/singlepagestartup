import { Clock } from "lucide-react";

import { ProfileByline } from "../../../../../social/models/profile/singlepage/byline/Component";

type ArticleFeaturedTarget = "_blank" | "_parent" | "_self" | "_top";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultArticleFeaturedProps = {
  href: undefined as string | undefined,
  slug: "how-to-choose",
  title: "How to Choose the Right Plan for Your Business",
  excerpt:
    "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
  coverImage:
    "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  category: "guides",
  authorName: "Sarah Kim",
  authorSlug: "sarah-kim",
  authorAvatar: sarahAvatar,
  date: "Feb 18, 2026",
  readTime: "7 min read",
  target: undefined as ArticleFeaturedTarget | undefined,
};

export type ArticleFeaturedProps = typeof defaultArticleFeaturedProps;

export function ArticleFeatured(props?: Partial<ArticleFeaturedProps>) {
  const {
    href,
    slug,
    title,
    excerpt,
    coverImage,
    category,
    authorName,
    authorAvatar,
    date,
    readTime,
    target,
  } = { ...defaultArticleFeaturedProps, ...props };
  const articleHref = href ?? `/blog/articles/${slug}`;

  return (
    <a
      href={articleHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group grid overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md md:grid-cols-2"
      data-ds-block="blog.article.featured"
      data-ds-imports="social.profile.byline"
      data-ds-layer="singlepage"
    >
      <div className="aspect-[16/10] overflow-hidden md:aspect-auto">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase text-slate-600">
            Featured
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase text-slate-600">
            {category}
          </span>
        </div>
        <h2 className="text-xl text-slate-900 group-hover:text-slate-700 lg:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-500">{excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <ProfileByline
            name={authorName}
            avatar={authorAvatar}
            href={null}
            size="sm"
          />
          <span className="text-xs text-slate-400">{date}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {readTime}
          </span>
        </div>
      </div>
    </a>
  );
}
