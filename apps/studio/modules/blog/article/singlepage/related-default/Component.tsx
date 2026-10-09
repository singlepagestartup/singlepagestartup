import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
/**
 * Model-owned compact article link for related-content collections.
 * Category and reading time share a row above the title and publication date.
 */

type ArticleRelatedDefaultTarget = "_blank" | "_parent" | "_self" | "_top";

export const defaultArticleRelatedDefaultProps = {
  href: undefined as string | undefined,
  slug: "getting-started",
  category: "guides",
  title: "Getting Started: From Zero to Your First Module",
  date: "Feb 3, 2026",
  readTime: "5 min read",
  target: undefined as ArticleRelatedDefaultTarget | undefined,
};

export type ArticleRelatedDefaultProps =
  typeof defaultArticleRelatedDefaultProps;

export function ArticleRelatedDefault(
  props?: Partial<ArticleRelatedDefaultProps>,
) {
  const { href, slug, category, title, date, readTime, target } = {
    ...defaultArticleRelatedDefaultProps,
    ...props,
  };
  return (
    <a
      href={href ?? `/blog/articles/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={`group block min-w-0 rounded-xl px-3 py-3 transition hover:bg-[var(--workspace-brand-background)] motion-reduce:transition-none ${kit.focus}`}
      data-ds-block="blog.article.related-default"
      data-ds-layer="singlepage"
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--workspace-brand-muted)]">
        <span className="rounded-md bg-[var(--workspace-brand-primary)] px-2.5 py-1 font-medium text-[var(--workspace-brand-on-primary)]">
          {category}
        </span>
        <span className="shrink-0">{readTime}</span>
      </div>
      <h4 className="text-sm font-semibold leading-[22px] text-[var(--workspace-brand-foreground)]">
        {title}
      </h4>
      <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">{date}</p>
    </a>
  );
}
