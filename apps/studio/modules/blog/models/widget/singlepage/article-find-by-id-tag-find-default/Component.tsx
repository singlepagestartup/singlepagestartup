/**
 * blog.widget.article-find-by-id-tag-find-default
 *
 * "Tags" card listing an article's tags. Owned by the blog module (model:
 * widget). Composes blog.tag.button-default chips instead of re-implementing them.
 */
import { Tag } from "../../../../../../workspace/utils/components/ModuleIcons";

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
      className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Tag className="size-5 text-[var(--workspace-brand-muted)]" />
        <span className="text-lg font-semibold text-[var(--workspace-brand-foreground)]">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagButtonDefault key={tag} label={tag} href={`/blog/tags/${tag}`} />
        ))}
      </div>
    </div>
  );
}
