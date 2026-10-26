import { memo } from "react";
import { Component as SharedIcon } from "../../../../shared/icon";
import type {
  IComponentProps,
  ArticleCardProps,
  ArticleCardTarget,
  IArticlePreview,
} from "./interface";
export type { ArticleCardProps } from "./interface";
import fixture from "../admin-v2-table/data.json";
/**
 * Model-owned article link. Balanced, editorial and compact are presentation
 * choices over the same article props; widgets compose this component.
 * The footer separates the Social profile byline from reading metadata.
 */

export const ArticleCard = memo<IComponentProps>(function ArticleCard(
  props?: IComponentProps,
) {
  const {
    href,
    slug,
    coverImage,
    category,
    date,
    createdAt,
    title,
    excerpt,
    excerptContent,
    media,
    authorName,
    authorAvatar,
    author,
    readTime,
    target,
    layout = "balanced",
  } = { ...defaultArticleCardProps, ...props };
  if (layout === "module" || layout === "guide")
    return (
      <article
        className={`group relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card hover:border-foreground ${layout === "guide" ? "flex flex-col p-5" : "p-4"}`}
        data-module="blog"
        data-model="article"
        data-variant="card"
        data-ds-block="blog.article.card"
        data-card-layout={layout}
      >
        <img
          src={media?.[0]?.src ?? coverImage}
          alt={media?.[0]?.alt ?? ""}
          width={1254}
          height={1254}
          loading="lazy"
          className={
            layout === "guide"
              ? "mb-4 aspect-[4/3] w-full rounded-xl bg-default object-contain"
              : "aspect-square w-full object-contain"
          }
        />
        {layout === "guide" ? (
          <span className="text-xs text-muted-foreground">{category}</span>
        ) : null}
        <h3
          className={`${layout === "guide" ? "mt-3 text-lg" : "mt-2 text-base leading-6"} font-semibold`}
        >
          <a
            href={href ?? `/blog/articles/${slug}`}
            target={target}
            rel={target === "_blank" ? "noreferrer" : undefined}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-foreground"
          >
            {title}
          </a>
        </h3>
        {excerpt ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {excerpt}
          </p>
        ) : null}
        {props?.actionLabel ? (
          <span className="mt-5 inline-flex items-center gap-2 text-sm">
            {props.actionLabel}
            <SharedIcon variant="phosphor" name="arrow-right" size={20} />
          </span>
        ) : null}
      </article>
    );
  const compact = layout === "compact";
  const editorial = layout === "editorial";
  const metadata = (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <div className="min-w-0 [&_a]:relative [&_a]:z-10">
        {author ?? (
          <span className="inline-flex min-w-0 items-center gap-2 text-xs">
            <img
              src={authorAvatar}
              alt=""
              className="size-6 shrink-0 rounded-lg object-contain"
            />
            <span>{authorName}</span>
          </span>
        )}
      </div>
      <div className="ml-auto shrink-0 text-right text-xs leading-5 text-muted-foreground">
        <p>{readTime}</p>
      </div>
    </div>
  );
  return (
    <article
      className={`group relative isolate grid h-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground motion-reduce:transition-none ${compact ? "grid-cols-[96px_minmax(0,1fr)] items-start gap-4 p-4" : "grid-rows-[auto_1fr]"} ${kit.focus}`}
      data-ds-block="blog.article.card"
      data-ds-layer="singlepage"
      data-card-layout={layout}
      data-module="blog"
      data-model="article"
      data-variant={props?.variant ?? "card"}
    >
      {editorial && (
        <div className="px-5 pb-5 pt-6 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{category}</span>
            <time dateTime={createdAt}>{date}</time>
          </div>
          <h3 className="text-2xl font-semibold leading-7 tracking-tight">
            <a
              href={href ?? `/blog/articles/${slug}`}
              target={target}
              rel={target === "_blank" ? "noreferrer" : undefined}
              aria-label={title?.trim() || "Read article"}
              className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-foreground"
            >
              {title}
            </a>
          </h3>
        </div>
      )}
      <div
        className={`aspect-square overflow-hidden ${compact ? "rounded-xl" : ""}`}
      >
        <img
          src={media?.[0]?.src ?? coverImage}
          alt={media?.[0]?.alt ?? ""}
          className="h-full w-full object-cover"
        />
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? "" : "p-5 sm:p-6"}`}>
        {!editorial && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{category}</span>
              <time dateTime={createdAt}>{date}</time>
            </div>
            <h3
              className={`${compact ? "text-lg leading-6" : "text-2xl leading-7"} font-semibold tracking-tight text-foreground`}
            >
              <a
                href={href ?? `/blog/articles/${slug}`}
                target={target}
                rel={target === "_blank" ? "noreferrer" : undefined}
                aria-label={title?.trim() || "Read article"}
                className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-foreground"
              >
                {title}
              </a>
            </h3>
          </>
        )}
        {excerptContent ? (
          <div className="mb-5 mt-3 text-sm leading-6 text-muted-foreground [&_a]:relative [&_a]:z-10">
            {excerptContent}
          </div>
        ) : excerpt ? (
          <p className="mb-5 mt-3 text-sm leading-[22px] text-muted-foreground">
            {excerpt}
          </p>
        ) : null}
        {media && media.length > 1 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {media.slice(1).map((item) => (
              <a
                key={item.id}
                href={item.src}
                target="_blank"
                rel="noreferrer"
                className="relative z-10 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="size-16 rounded-lg object-cover"
                />
              </a>
            ))}
          </div>
        ) : null}
        {!compact && <div className="mt-auto">{metadata}</div>}
      </div>
      {compact && <div className="col-span-2">{metadata}</div>}
    </article>
  );
});
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
/** Supplied Studio records and associations; no runtime reads or publication proof. */
export const frameworkArticlePreviews: IArticlePreview[] = fixture.records.map(
  (record) => {
    const presentation = fixture.presentation.articles.find(
      (item) => item.id === record.id,
    )!;
    const calendar = new Date(`${record.createdAt}T00:00:00Z`);
    const createdAt =
      Number.isFinite(calendar.getTime()) &&
      calendar.toISOString().slice(0, 10) === record.createdAt
        ? record.createdAt
        : undefined;
    return {
      id: record.id,
      href: `/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default&args=articleSlug:${record.slug}`,
      slug: record.slug,
      title: record.title.en,
      excerpt: record.subtitle.en,
      content: record.description.en,
      coverImage: presentation.coverImage,
      media: [
        {
          id: `${record.id}:cover`,
          src: presentation.coverImage,
          alt: presentation.coverAlt,
        },
      ],
      category: presentation.categoryLabel,
      categorySlug: presentation.categorySlug,
      createdAt,
      date: createdAt
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          }).format(calendar)
        : "",
      authorName: fixture.presentation.author.name,
      authorRole: fixture.presentation.author.role,
      authorAvatar: fixture.presentation.author.avatar,
      authorSlug: fixture.presentation.author.slug,
      commentCount: 0,
      readTime: presentation.readTime,
      outline: presentation.outline,
      target: "_top",
    };
  },
);

export const defaultArticleCardProps: ArticleCardProps = {
  ...frameworkArticlePreviews[0],
  media: undefined,
  href: undefined,
  target: undefined as ArticleCardTarget | undefined,
};
