import { Component as SocialModuleProfile } from "../../../../social/profile";
import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { ArrowUpRight } from "../../../../../workspace/utils/components/ModuleIcons";

type ArticleFeaturedTarget = "_blank" | "_parent" | "_self" | "_top";

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultArticleFeaturedProps = {
  href: undefined as string | undefined,
  slug: "how-to-choose",
  title: "How to Choose the Right Plan for Your Business",
  excerpt:
    "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
  coverImage: new URL(
    "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
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
  return (
    <a
      href={href ?? `/blog/articles/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={`group grid min-w-0 overflow-hidden rounded-3xl bg-[var(--workspace-brand-primary)] text-[var(--workspace-brand-on-primary)] md:grid-cols-2 ${kit.focus}`}
      data-ds-block="blog.article.featured"
      data-ds-imports="social.profile.byline"
      data-ds-layer="singlepage"
    >
      <div className="aspect-square min-w-0 overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1.5 font-medium text-[var(--workspace-brand-on-accent)]">
              Featured article
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1.5">
              {category}
            </span>
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-[26px] text-[var(--workspace-brand-muted-on-primary)]">
            {excerpt}
          </p>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5 text-xs text-[var(--workspace-brand-muted-on-primary)]">
            <SocialModuleProfile
              variant="byline"
              inverse
              name={authorName}
              avatar={authorAvatar}
              href={null}
              size="xs"
            />
            <span>{date}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--workspace-brand-muted-on-primary)]">
              {readTime}
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--workspace-brand-accent)] px-5 py-2 text-sm font-semibold text-[var(--workspace-brand-on-accent)]">
              Read article <ArrowUpRight className="size-5" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
