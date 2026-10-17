import type { IComponentProps, ArticleFindDefaultProps } from "./interface";
export type { ArticleFindDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
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

interface BlogPostItem {
  image: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}

export function ArticleFindDefault(props?: IComponentProps) {
  const { eyebrow, title, viewAllAction, posts } = {
    ...defaultArticleFindDefaultProps,
    ...props,
  };
  const articleHref =
    "/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default";
  return (
    <section
      id="blog"
      className="w-full py-16 lg:py-24"
      data-ds-block="blog.widget.article-find-default"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="widget"
      data-variant={props?.variant ?? "article-find-default"}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h2>
          </div>
          <a className={kit.secondary} href={viewAllAction.href}>
            {viewAllAction.label}
            <ChevronRight className="size-5" />
          </a>
        </div>
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <a
              href={articleHref}
              target="_top"
              className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground motion-reduce:transition-none ${kit.focus}`}
              key={post.title}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={post.image}
                  alt={post.title}
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1.5">
                    {post.tag}
                  </span>
                  <span>{post.date}</span>
                </div>
                <h3 className="text-2xl font-semibold leading-7 tracking-tight">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-2 flex-1 text-sm leading-[22px] text-muted-foreground">
                  {post.excerpt}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span className="text-muted-foreground">{post.readTime}</span>
                  <span className="inline-flex items-center gap-2 font-medium">
                    Read article
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
const ChevronRight = createIcon("caret-right");
const ArrowUpRight = createIcon("arrow-up-right");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
  focus: focus,
};
export const defaultArticleFindDefaultProps = {
  eyebrow: "Latest Articles",
  title: "From the Blog",
  viewAllAction: { label: "View all posts", href: "/blog" },
  posts: [
    {
      image:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
      tag: "Analytics",
      title: "How to Build Data-Driven Dashboards",
      excerpt:
        "Learn how to leverage the Analytics module to create insightful dashboards and track key performance metrics.",
      date: "Feb 18, 2026",
      readTime: "5 min read",
    },
    {
      image:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
      tag: "Infrastructure",
      title: "Scaling Your Platform Architecture",
      excerpt:
        "Best practices for scaling from a single-page startup to enterprise-grade infrastructure with our Host module.",
      date: "Feb 12, 2026",
      readTime: "8 min read",
    },
    {
      image:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
      tag: "Development",
      title: "API Integration Step-by-Step",
      excerpt:
        "A comprehensive tutorial for integrating with our REST API and building custom workflows with webhooks.",
      date: "Feb 5, 2026",
      readTime: "12 min read",
    },
  ] satisfies BlogPostItem[],
};
