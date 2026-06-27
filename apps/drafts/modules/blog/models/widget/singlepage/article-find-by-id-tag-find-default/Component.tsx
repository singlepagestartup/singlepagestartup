/**
 * blog.widget.article-find-by-id-tag-find-default
 *
 * "Tags" card listing an article's tags. Owned by the blog module (model:
 * widget). Composes blog.tag.button-default chips instead of re-implementing them.
 */
import { Tag } from "lucide-react";

import { TagButtonDefault } from "../../../tag/singlepage/button-default/Component";

export const defaultArticleFindByIdTagFindProps = {
  title: "Tags",
  tags: ["pricing", "plans", "getting-started"],
};

export type ArticleFindByIdTagFindProps =
  typeof defaultArticleFindByIdTagFindProps;

export function ArticleFindByIdTagFind(
  props?: Partial<ArticleFindByIdTagFindProps>,
) {
  const { title, tags } = { ...defaultArticleFindByIdTagFindProps, ...props };

  return (
    <div
      data-ds-block="blog.widget.article-find-by-id-tag-find-default"
      data-ds-imports="blog.tag.button-default"
      data-ds-layer="singlepage"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-900">{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagButtonDefault key={tag} label={tag} href={`/blog/tags/${tag}`} />
        ))}
      </div>
    </div>
  );
}
