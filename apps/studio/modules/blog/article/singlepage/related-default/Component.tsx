import { frameworkArticlePreviews } from "../card/Component";
import type { IComponentProps, ArticleRelatedDefaultProps } from "./interface";
export type { ArticleRelatedDefaultProps } from "./interface";
/**
 * Model-owned compact article link for related-content collections.
 * Category and reading time share a row above the title and publication date.
 */

export function ArticleRelatedDefault(props?: IComponentProps) {
  const { href, slug, category, title, date, readTime, target } = {
    ...defaultArticleRelatedDefaultProps,
    ...props,
  };
  return (
    <a
      href={href ?? `/blog/articles/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={`group block min-w-0 rounded-xl px-3 py-3 transition hover:bg-muted motion-reduce:transition-none ${kit.focus}`}
      data-ds-block="blog.article.related-default"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="article"
      data-variant={props?.variant ?? "related-default"}
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="rounded-md bg-default px-2.5 py-1 font-medium text-default-foreground">
          {category}
        </span>
        <span className="shrink-0">{readTime}</span>
      </div>
      <h4 className="text-sm font-semibold leading-[22px] text-foreground">
        {title}
      </h4>
      <p className="mt-2 text-xs text-muted-foreground">{date}</p>
    </a>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
export const defaultArticleRelatedDefaultProps: ArticleRelatedDefaultProps = {
  ...frameworkArticlePreviews[1],
  href: undefined,
  target: undefined,
};
