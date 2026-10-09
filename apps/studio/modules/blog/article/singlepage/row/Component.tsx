import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
/**
 * Model-owned article row with a square source image, a reading summary and
 * one metadata footer. Profile article collections compose this component.
 */

type ArticleRowTarget = "_blank" | "_parent" | "_self" | "_top";

const defaultCover = new URL(
  "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  import.meta.url,
).href;

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
  return (
    <a
      href={href ?? `/blog/articles/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={`@container group block min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] transition hover:border-[var(--workspace-brand-foreground)] motion-reduce:transition-none ${kit.focus}`}
      data-ds-block="blog.article.row"
      data-ds-layer="singlepage"
    >
      <div className="grid min-w-0 @[560px]:grid-cols-[200px_minmax(0,1fr)]">
        <div className="aspect-square overflow-hidden @[560px]:aspect-auto">
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col p-5 @[560px]:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--workspace-brand-muted)]">
            <span className="font-medium">{category}</span>
            <span>{date}</span>
          </div>
          <h3 className="text-2xl font-semibold leading-7 tracking-tight text-[var(--workspace-brand-foreground)]">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
            {excerpt}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] pt-4 text-xs text-[var(--workspace-brand-muted)]">
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 2).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
            <span>
              {readTime} · {commentCount} comments
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
