/**
 * blog.article.related-default
 *
 * Compact related-article item: anchor with border card styling, category chip,
 * title, date + read time (Clock icon). Root element is an anchor linking to
 * /blog/articles/<slug>.
 *
 * Owned by the blog module (model: article). Display components such as the
 * ArticleDetail sidebar compose this via import instead of re-implementing
 * the markup.
 *
 * Source: BlogSections ArticleDetail sidebar related-articles items.
 */

import { Clock } from "lucide-react";

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
  const articleHref = href ?? `/blog/articles/${slug}`;

  return (
    <a
      href={articleHref}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group block rounded-lg border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
      data-ds-block="blog.article.related-default"
      data-ds-layer="singlepage"
    >
      <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 uppercase">
        {category}
      </span>
      <h4 className="mt-1.5 text-sm text-slate-900 group-hover:text-slate-700">
        {title}
      </h4>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
        <span>{date}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {readTime}
        </span>
      </div>
    </a>
  );
}
