import { memo } from "react";
import type { IComponentProps, ArticleCardProps } from "./interface";
export type { ArticleCardProps } from "./interface";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
/**
 * Model-owned article link. Balanced, editorial and compact are presentation
 * choices over the same article props; widgets compose this component.
 * The footer separates the Social profile byline from reading metadata.
 */

export const ArticleCard = memo<IComponentProps>(function ArticleCard(
  props?: IComponentProps,
) {
  const {
    href,
    slug,
    coverImage,
    category,
    date,
    title,
    excerpt,
    excerptContent,
    media,
    authorName,
    authorAvatar,
    readTime,
    target,
    layout = "balanced",
  } = { ...defaultArticleCardProps, ...props };
  const compact = layout === "compact";
  const editorial = layout === "editorial";
  const metadata = (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <div className="min-w-0">
        <SocialModuleProfile
          variant="byline"
          name={authorName}
          avatar={authorAvatar}
          href={null}
          size="xs"
        />
      </div>
      <div className="ml-auto shrink-0 text-right text-xs leading-5 text-muted-foreground">
        <p>{readTime}</p>
      </div>
    </div>
  );
  return (
    <article
      className={`group grid h-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground motion-reduce:transition-none ${compact ? "grid-cols-[96px_minmax(0,1fr)] items-start gap-4 p-4" : "grid-rows-[auto_1fr]"} ${kit.focus}`}
      data-ds-block="blog.article.card"
      data-ds-imports="social.profile.byline"
      data-ds-layer="singlepage"
      data-card-layout={layout}
      data-module="blog"
      data-model="article"
      data-variant={props?.variant ?? "card"}
    >
      {editorial && (
        <div className="px-5 pb-5 pt-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{category}</span>
            <span>{date}</span>
          </div>
          <h3 className="text-2xl font-semibold leading-7 tracking-tight">
            <a
              href={href ?? `/blog/articles/${slug}`}
              target={target}
              rel={target === "_blank" ? "noreferrer" : undefined}
              className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {title}
            </a>
          </h3>
        </div>
      )}
      <div
        className={`aspect-square overflow-hidden ${compact ? "rounded-xl" : ""}`}
      >
        <a
          href={href ?? `/blog/articles/${slug}`}
          target={target}
          aria-label={`Read ${title}`}
          className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <img
            src={media?.[0]?.src ?? coverImage}
            alt={media?.[0]?.alt ?? ""}
            className="h-full w-full object-cover"
          />
        </a>
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? "" : "p-5 sm:p-6"}`}>
        {!editorial && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{category}</span>
              <span>{date}</span>
            </div>
            <h3
              className={`${compact ? "text-lg leading-6" : "text-2xl leading-7"} font-semibold tracking-tight text-foreground`}
            >
              <a
                href={href ?? `/blog/articles/${slug}`}
                target={target}
                rel={target === "_blank" ? "noreferrer" : undefined}
                className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {title}
              </a>
            </h3>
          </>
        )}
        {excerptContent ? (
          <div className="mb-5 mt-3 text-sm leading-6 text-muted-foreground">
            {excerptContent}
          </div>
        ) : excerpt ? (
          <p className="mb-5 mt-3 text-sm leading-[22px] text-muted-foreground">
            {excerpt}
          </p>
        ) : null}
        {media && media.length > 1 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {media.slice(1).map((item) => (
              <a
                key={item.id}
                href={item.src}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="size-16 rounded-lg object-cover"
                />
              </a>
            ))}
          </div>
        ) : null}
        {!compact && <div className="mt-auto">{metadata}</div>}
      </div>
      {compact && <div className="col-span-2">{metadata}</div>}
    </article>
  );
});
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
export const defaultArticleCardProps = {
  href: undefined as string | undefined,
  slug: "how-to-choose",
  coverImage:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
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

import type { ArticleCardTarget } from "./interface";
