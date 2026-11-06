import type { IComponentProps, ArticleFeaturedProps } from "./interface";
export type { ArticleFeaturedProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { defaultArticleCardProps } from "../card/Component";
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

export function ArticleFeatured(props?: IComponentProps) {
  const {
    href,
    slug,
    title,
    excerpt,
    coverImage,
    category,
    authorName,
    authorAvatar,
    author,
    date,
    createdAt,
    readTime,
    target,
  } = { ...defaultArticleFeaturedProps, ...props };
  return (
    <a
      href={href ?? `/blog/articles/${slug}`}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={`group grid min-w-0 overflow-hidden rounded-3xl bg-default text-default-foreground md:grid-cols-2 ${kit.focus}`}
      data-ds-block="blog.article.featured"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="article"
      data-variant={props?.variant ?? "featured"}
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
            <span className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 font-medium">
              Featured article
            </span>
            <span className="rounded-full border border-default-foreground/20 px-3 py-1.5">
              {category}
            </span>
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-[26px] text-default-muted-foreground">
            {excerpt}
          </p>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-default-foreground/20 pt-5 text-xs text-default-muted-foreground">
            {author ?? (
              <span className="inline-flex items-center gap-2">
                <img
                  src={authorAvatar}
                  alt=""
                  className="size-6 rounded-lg bg-card object-contain"
                />
                {authorName}
              </span>
            )}
            <time dateTime={createdAt}>{date}</time>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-default-muted-foreground">
              {readTime}
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold">
              Read article <ArrowUpRight className="size-5" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
const ArrowUpRight = createIcon("arrow-up-right");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
export const defaultArticleFeaturedProps: ArticleFeaturedProps = {
  ...defaultArticleCardProps,
  target: undefined,
};
