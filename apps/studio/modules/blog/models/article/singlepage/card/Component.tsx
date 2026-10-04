import { kit } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
/**
 * Model-owned article link. Balanced, editorial and compact are presentation
 * choices over the same article props; widgets compose this component.
 * The footer separates the Social profile byline from reading metadata.
 */

import { ProfileByline } from "../../../../../social/models/profile/singlepage/byline/Component";

type ArticleCardTarget = "_blank" | "_parent" | "_self" | "_top";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultArticleCardProps = {
  href: undefined as string | undefined,
  slug: "how-to-choose",
  coverImage: new URL(
    "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
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

export type ArticleCardProps = typeof defaultArticleCardProps & {
  /** Presentation choice only; the article record contract stays unchanged. */
  layout?: "balanced" | "editorial" | "compact";
};

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
    readTime,
    target,
    layout = "balanced",
  } = { ...defaultArticleCardProps, ...props };
  const compact = layout === "compact";
  const editorial = layout === "editorial";
  const metadata = (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] pt-4">
      <div className="min-w-0">
        <ProfileByline
          name={authorName}
          avatar={authorAvatar}
          href={null}
          size="xs"
        />
      </div>
      <div className="ml-auto shrink-0 text-right text-xs leading-5 text-[var(--workspace-brand-muted)]">
        <p>{readTime}</p>
      </div>
    </div>
  );
  return (
    <a
      href={href ?? `/blog/articles/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={`group grid h-full min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] transition hover:border-[var(--workspace-brand-foreground)] motion-reduce:transition-none ${compact ? "grid-cols-[96px_minmax(0,1fr)] items-start gap-4 p-4" : "grid-rows-[auto_1fr]"} ${kit.focus}`}
      data-ds-block="blog.article.card"
      data-ds-imports="social.profile.byline"
      data-ds-layer="singlepage"
      data-card-layout={layout}
    >
      {editorial && (
        <div className="px-5 pb-5 pt-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[var(--workspace-brand-muted)]">
            <span>{category}</span>
            <span>{date}</span>
          </div>
          <h3 className="text-2xl font-semibold leading-7 tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div
        className={`aspect-square overflow-hidden ${compact ? "rounded-xl" : ""}`}
      >
        <img src={coverImage} alt="" className="h-full w-full object-cover" />
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? "" : "p-5 sm:p-6"}`}>
        {!editorial && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--workspace-brand-muted)]">
              <span className="font-medium">{category}</span>
              <span>{date}</span>
            </div>
            <h3
              className={`${compact ? "text-lg leading-6" : "text-2xl leading-7"} font-semibold tracking-tight text-[var(--workspace-brand-foreground)]`}
            >
              {title}
            </h3>
          </>
        )}
        {!compact && (
          <p className="mb-5 mt-3 line-clamp-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
            {excerpt}
          </p>
        )}
        {!compact && <div className="mt-auto">{metadata}</div>}
      </div>
      {compact && <div className="col-span-2">{metadata}</div>}
    </a>
  );
}
