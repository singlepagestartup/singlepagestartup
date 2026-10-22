"use client";
import type {
  IComponentPropsExtended,
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
  ArticleDetailProps,
} from "./interface";
export type {
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
  ArticleDetailProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
  type ReactNode,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as SocialModuleWidget } from "../../../../social/widget/index";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product/index";
import { Component as Tag } from "../../../tag/index";
import { ArticleRelatedDefault } from "../related-default/Component";
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

export function Component(props: IComponentPropsExtended) {
  const {
    slug,
    category,
    tags,
    title,
    authorName,
    authorRole,
    authorAvatar,
    date,
    readTime,
    totalComments,
    content,
    pinnedProducts,
    comments,
    relatedArticles,
    cover,
    tagsCard,
    widgets,
  } = props;
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(`/blog/articles/${slug}`, window.location.origin).href,
      );
      setCopyStatus("Article link copied.");
    } catch {
      setCopyStatus("Copy is unavailable in this preview.");
    }
  }
  return (
    <div
      className="w-full min-w-0"
      data-ds-block="blog.article.detail"
      data-ds-imports="blog.tag.button-default blog.article.related-default social.profile.article-find-by-id-comment-form-default social.widget.profile-article-find-by-id-comment-find-default"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="article"
      data-variant={props?.variant ?? "detail"}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav
          aria-label="Article breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <a
            href={blogIndexStoryHref}
            target="_top"
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl hover:text-foreground ${kit.focus}`}
          >
            <ArrowLeft className="size-5" />
            All articles
          </a>
          <ChevronRight className="size-5" />
          <span>{category}</span>
        </nav>
        <header
          className={`grid min-w-0 gap-4 ${cover ? "lg:grid-cols-2" : ""}`}
        >
          <div className="flex min-w-0 flex-col justify-between gap-8 rounded-3xl bg-default p-6 text-default-foreground sm:p-8 lg:p-10">
            <div>
              <span className="inline-flex rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">
                {category}
              </span>
              <h1 className="mt-6 break-words text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
                {title}
              </h1>
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-default-foreground/20 pt-5">
              <SocialModuleProfile
                variant="compact"
                inverse
                name={authorName}
                role={authorRole}
                avatar={authorAvatar}
                href={authorOverviewStoryHref}
                target="_top"
              />
              <div className="text-right text-xs leading-5 text-default-muted-foreground">
                <p>{date}</p>
                <p>{readTime}</p>
              </div>
            </div>
          </div>
          {cover && <div className="min-w-0">{cover}</div>}
        </header>
        <div className="grid min-w-0 items-start gap-6 pt-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="min-w-0 space-y-8">
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Tag
                    variant="button-default"
                    key={tag}
                    label={tag}
                    href={`/blog/tags/${tag}`}
                  />
                ))}
              </div>
              <WebsiteBuilderModuleWidget
                variant="content-rich"
                content={content}
              />
              {widgets ? <div className="mt-8 space-y-6">{widgets}</div> : null}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <Button variant="secondary" onClick={copyLink}>
                  <Share2 className="size-5" />
                  Copy link
                </Button>
                <Button
                  variant="secondary"
                  aria-pressed={saved}
                  onClick={() => setSaved((value) => !value)}
                >
                  <Bookmark className="size-5" />
                  {saved ? "Saved in preview" : "Save article"}
                </Button>
              </div>
              <p
                aria-live="polite"
                className="mt-3 text-xs text-muted-foreground"
              >
                {copyStatus ||
                  (saved ? "Saved locally for this preview session." : "")}
              </p>
            </div>
            <section
              aria-label="Article comments"
              className="rounded-3xl border border-border bg-card p-5 sm:p-8"
            >
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold tracking-tight">
                <MessageSquare className="size-6" />
                Comments{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {totalComments}
                </span>
              </h2>
              <div className="mb-8">
                <SocialModuleProfile variant="article-find-by-id-comment-form-default" />
              </div>
              <SocialModuleWidget
                variant="profile-article-find-by-id-comment-find-default"
                comments={comments}
              />
            </section>
          </div>
          <aside aria-label="Related resources" className="min-w-0 space-y-6">
            <SocialModuleProfile
              variant="card"
              name={authorName}
              role={authorRole}
              avatar={authorAvatar}
              href={authorOverviewStoryHref}
              target="_top"
            />
            {pinnedProducts.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 text-lg font-semibold">Related products</h2>
                <div className="space-y-4">
                  {pinnedProducts.map((product) => (
                    <EcommerceModuleProduct
                      variant="pinned"
                      key={product.id}
                      slug={product.slug}
                      title={product.title}
                      shortDescription={product.shortDescription}
                      priceLabel={product.priceLabel}
                      category={product.category}
                      href={productOverviewStoryHref}
                      target="_top"
                    />
                  ))}
                </div>
              </section>
            )}
            {tagsCard}
            {relatedArticles.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 text-lg font-semibold">Keep reading</h2>
                <div className="space-y-3">
                  {relatedArticles.map((rel) => (
                    <ArticleRelatedDefault
                      key={rel.id}
                      href={articleOverviewStoryHref}
                      slug={rel.slug}
                      category={rel.category}
                      title={rel.title}
                      date={rel.date}
                      readTime={rel.readTime}
                      target="_top"
                    />
                  ))}
                </div>
              </section>
            )}
            <a
              href={blogIndexStoryHref}
              target="_top"
              className={`${kit.secondary} w-full`}
            >
              <ArrowLeft className="size-5" />
              Back to all articles
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
const Share2 = createIcon("share-network");
const MessageSquare = createIcon("chat");
const ChevronRight = createIcon("caret-right");
const Bookmark = createIcon("bookmark-simple");
const ArrowLeft = createIcon("arrow-left");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
  focus: focus,
};
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default";
const authorOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-social-module-profile-slug-author--default";
const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-slug--default";
const blogIndexStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default";
