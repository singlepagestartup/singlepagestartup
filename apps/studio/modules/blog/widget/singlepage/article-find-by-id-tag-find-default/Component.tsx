import type { IComponentProps, ArticleFindByIdTagFindProps } from "./interface";
export type { ArticleFindByIdTagFindProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Tag } from "../../../tag/index";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ArticleFindByIdTagFind(props?: IComponentProps) {
  const { title, tags } = { ...defaultArticleFindByIdTagFindProps, ...props };
  return (
    <div
      data-ds-block="blog.widget.article-find-by-id-tag-find-default"
      data-ds-imports="blog.tag.button-default"
      data-ds-layer="singlepage"
      className="rounded-2xl border border-border bg-card p-5"
      data-module="blog"
      data-model="widget"
      data-variant={props?.variant ?? "article-find-by-id-tag-find-default"}
    >
      <div className="mb-3 flex items-center gap-2">
        <TagIcon className="size-5 text-muted-foreground" />
        <span className="text-lg font-semibold text-foreground">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag
            variant="button-default"
            key={tag}
            label={tag}
            href={`/blog/tags/${tag}`}
          />
        ))}
      </div>
    </div>
  );
}
const TagIcon = createIcon("tag");
export const defaultArticleFindByIdTagFindProps = {
  title: "Tags",
  tags: ["pricing", "plans", "getting-started"],
};
