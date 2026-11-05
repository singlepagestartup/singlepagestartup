"use client";
import type { IComponentPropsExtended, BlogCommentData } from "./interface";
export type {
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
  ArticleDetailProps,
} from "./interface";
import { memo, useEffect, useRef, useState } from "react";
import { Component as SharedIcon } from "../../../../shared/icon";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product";
import { Component as Tag } from "../../../tag";
import { ArticleRelatedDefault } from "../related-default/Component";

interface ICommentPreviewProps {
  comment: BlogCommentData;
  nested?: boolean;
}

const CommentPreview = memo(function CommentPreview({
  comment,
  nested = false,
}: ICommentPreviewProps) {
  const initials = comment.author
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <article
      className={
        nested
          ? "min-w-0 border-l-2 border-border pl-3"
          : "min-w-0 rounded-2xl border border-border p-4"
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        {comment.avatar ? (
          <img
            src={comment.avatar}
            alt=""
            className="size-9 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium"
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{comment.author}</p>
          <p className="mt-1 text-xs text-muted-foreground">{comment.date}</p>
          <p className="mt-3 break-words leading-7">{comment.text}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <SharedIcon variant="phosphor" name="thumbs-up" />
            {comment.likes} likes
          </p>
        </div>
      </div>
      {!!comment.replies?.length && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentPreview key={reply.id} comment={reply} nested />
          ))}
        </div>
      )}
    </article>
  );
});

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
    createdAt,
    excerpt,
    readTime,
    totalComments,
    content,
    pinnedProducts,
    comments,
    relatedArticles,
    cover,
    tagsCard,
    widgets,
    breadcrumb,
    outline = [],
    contents,
    navigation,
    author,
    authorCard,
    commentsContent,
  } = props;
  const body = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    setSaved(false);
    setCopyStatus("");
  }, [slug]);
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
  function readSection(label: string) {
    const heading = [
      ...(body.current?.querySelectorAll<HTMLElement>("h2,h3") ?? []),
    ].find((item) => item.textContent?.trim() === label);
    if (!heading) return;
    heading.tabIndex = -1;
    heading.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  }
  return (
    <div
      className="w-full min-w-0"
      data-ds-block="blog.article.detail"
      data-ds-imports="blog.tag.button-default blog.article.related-default website-builder.widget.content-rich"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="article"
      data-variant={props.variant ?? "detail"}
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:gap-10 lg:px-8">
        <header className="min-w-0 max-w-4xl">
          {breadcrumb ?? (
            <nav
              aria-label="Article breadcrumb"
              className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-muted-foreground"
            >
              <a
                href={blogIndexStoryHref}
                target="_top"
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl hover:text-foreground ${focus}`}
              >
                <SharedIcon variant="phosphor" name="arrow-left" />
                The Framework journal
              </a>
              <span aria-hidden="true">/</span>
              <span>{category}</span>
            </nav>
          )}
          <h1 className="mt-6 text-balance text-3xl font-semibold leading-tight tracking-normal sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {excerpt && (
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {excerpt}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            {author ?? (
              <div className="inline-flex min-w-0 items-center gap-3">
                <img
                  src={authorAvatar}
                  alt=""
                  className="size-10 shrink-0 rounded-xl bg-card object-contain"
                />
                <div>
                  <p className="font-medium">{authorName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {authorRole}
                  </p>
                </div>
              </div>
            )}
            <time dateTime={createdAt} className="text-muted-foreground">
              {date}
            </time>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <SharedIcon variant="phosphor" name="clock" />
              {readTime}
            </p>
          </div>
        </header>
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_256px] lg:gap-10">
          <div className="min-w-0 space-y-8">
            <div
              className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-8"
              ref={body}
            >
              {cover && (
                <div className="mx-auto mb-8 w-full max-w-lg">{cover}</div>
              )}
              {tags.length > 0 && (
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
              )}
              <div className="min-w-0 [&_a]:[overflow-wrap:anywhere] [&_h2]:scroll-mt-28 [&_h3]:scroll-mt-28 [&_pre]:max-w-full">
                <WebsiteBuilderModuleWidget
                  variant="content-rich"
                  content={content}
                />
              </div>
              {widgets && <div className="mt-8 space-y-6">{widgets}</div>}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <WebsiteBuilderModuleButton
                  variant="control"
                  appearance="secondary"
                  onClick={copyLink}
                >
                  <SharedIcon variant="phosphor" name="share-network" />
                  Copy link
                </WebsiteBuilderModuleButton>
                <WebsiteBuilderModuleButton
                  variant="control"
                  appearance="secondary"
                  aria-pressed={saved}
                  onClick={() => setSaved((value) => !value)}
                >
                  <SharedIcon variant="phosphor" name="bookmark-simple" />
                  {saved ? "Saved in preview" : "Save article"}
                </WebsiteBuilderModuleButton>
              </div>
              <p role="status" className="mt-3 text-xs text-muted-foreground">
                {copyStatus ||
                  (saved ? "Saved locally for this preview session." : "")}
              </p>
            </div>
            {(commentsContent || comments.length > 0) && (
              <section
                aria-label="Article comments"
                className="rounded-3xl border border-border bg-card p-5 sm:p-8"
              >
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold">
                  <SharedIcon variant="phosphor" name="chat" size={24} />
                  Comments{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    {totalComments}
                  </span>
                </h2>
                {commentsContent ?? (
                  <div className="space-y-5">
                    {comments.map((comment) => (
                      <CommentPreview key={comment.id} comment={comment} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
          <aside
            aria-label="Article resources"
            className="order-first min-w-0 space-y-6 lg:order-last"
          >
            {(contents || outline.length > 0) && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold">In this guide</h2>
                {contents ?? (
                  <nav aria-label="In this guide" className="mt-3 grid gap-1">
                    {outline.map((heading) => (
                      <button
                        type="button"
                        key={heading.id}
                        onClick={() => readSection(heading.title)}
                        className={`min-h-11 rounded-lg py-2 text-left text-sm leading-6 text-muted-foreground hover:underline ${focus}`}
                      >
                        {heading.title}
                      </button>
                    ))}
                  </nav>
                )}
              </section>
            )}
            {authorCard}
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
                  {relatedArticles.map((article) => (
                    <ArticleRelatedDefault
                      key={article.id}
                      {...article}
                      href={`/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default&args=articleSlug:${article.slug}`}
                      target="_top"
                    />
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
        {navigation}
      </div>
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const blogIndexStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default";
