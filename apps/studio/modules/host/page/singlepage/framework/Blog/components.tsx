import {
  memo,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import Markdown from "markdown-to-jsx";
import type { FrameworkLinkResolver } from "../interface";
import { Icon, kit } from "../primitives";
import { PreviewLink, siteStyles } from "../Site";
import {
  blogCopy,
  blogCover,
  blogHeadingId,
  categories,
  formatBlogDate,
  type IBlogArticle,
} from "./content";

interface IBlogLinkProps {
  resolveLink?: FrameworkLinkResolver;
}

interface IArticleCardProps extends IBlogLinkProps {
  article: IBlogArticle;
}

interface IMarkdownBodyProps extends IBlogLinkProps {
  children: string;
}

interface IContentsLinkProps {
  href: string;
  children: ReactNode;
}

export const ArticleCard = memo(function ArticleCard({
  article,
  resolveLink,
}: IArticleCardProps) {
  const category = categories.find((item) => item.slug === article.category);
  return (
    <article className="flex min-w-0">
      <PreviewLink
        href={`/blog/articles/${article.slug}`}
        resolveLink={resolveLink}
        className={`group flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition hover:border-[hsl(var(--muted-foreground))] motion-reduce:transition-none ${siteStyles.focus}`}
      >
        <img
          src={blogCover(article.cover)}
          alt={article.coverAlt}
          loading="lazy"
          width={1254}
          height={1254}
          className="aspect-square w-full object-cover"
        />
        <div className="flex flex-1 flex-col p-5 @3xl:p-6">
          <div
            className={`flex flex-wrap items-center gap-3 text-xs ${siteStyles.muted}`}
          >
            <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 font-medium text-[hsl(var(--foreground))]">
              {category?.title ?? article.category}
            </span>
            {article.createdAt && (
              <time dateTime={article.createdAt}>
                {formatBlogDate(article.createdAt)}
              </time>
            )}
            <span>
              {article.minutes} {blogCopy.minuteLabel}
            </span>
          </div>
          <h2 className={`mt-4 text-xl leading-snug ${siteStyles.display}`}>
            {article.title}
          </h2>
          <p className={`mt-3 text-sm leading-6 ${siteStyles.muted}`}>
            {article.excerpt}
          </p>
          <div className="mt-auto pt-5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold group-hover:underline">
              {blogCopy.readLabel}
              <Icon name="arrow-right" size={20} />
            </span>
            <p
              className={`mt-5 border-t border-[hsl(var(--border))] pt-4 text-xs ${siteStyles.muted}`}
            >
              {article.author}
            </p>
          </div>
        </div>
      </PreviewLink>
    </article>
  );
});
export { FeaturedCategories as CategoryLinks } from "./FeaturedCategories";

export function BlogPreparation({ resolveLink }: IBlogLinkProps) {
  return (
    <section className="grid gap-6 rounded-3xl bg-[hsl(var(--default))] p-6 text-[hsl(var(--default-foreground))] @3xl:grid-cols-[1fr_auto] @3xl:items-center @3xl:p-8">
      <div>
        <h2
          className={`max-w-2xl text-2xl leading-tight @3xl:text-3xl ${siteStyles.display}`}
        >
          {blogCopy.ctaTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--default-muted-foreground))]">
          {blogCopy.ctaDescription}
        </p>
      </div>
      <div className="flex min-w-0 flex-col items-stretch gap-3 @3xl:max-w-60">
        <PreviewLink
          href="/"
          resolveLink={resolveLink}
          className={`${kit.button} text-center hover:brightness-95`}
        >
          {blogCopy.chatLabel}
          <Icon name="arrow-up-right" size={20} />
        </PreviewLink>
        <PreviewLink
          href="/framework"
          resolveLink={resolveLink}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-sm font-medium hover:underline ${siteStyles.focus}`}
        >
          {blogCopy.frameworkLabel}
          <Icon name="arrow-right" size={20} />
        </PreviewLink>
      </div>
    </section>
  );
}

export function ContentsLink({ href, children }: IContentsLinkProps) {
  const move = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const target = event.currentTarget.ownerDocument.getElementById(
      href.slice(1),
    );
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: "start" });
    target.focus({ preventScroll: true });
  };
  return (
    <a
      href={href}
      onClick={move}
      className={`block rounded-lg py-2 text-sm leading-6 hover:underline ${siteStyles.focus}`}
    >
      {children}
    </a>
  );
}

export function MarkdownBody({ children, resolveLink }: IMarkdownBodyProps) {
  return (
    <div
      className={`min-w-0 break-words text-base leading-8 ${siteStyles.muted} [&_p]:my-5 [&_h2]:scroll-mt-28 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-[hsl(var(--foreground))] [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[hsl(var(--foreground))] [&_a]:break-words [&_a]:text-[hsl(var(--foreground))] [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-[hsl(var(--muted))] [&_code]:px-1 [&_code]:text-sm [&_pre]:my-6 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[hsl(var(--default))] [&_pre]:p-5 [&_pre]:text-[hsl(var(--default-foreground))] [&_pre_code]:whitespace-pre [&_pre_code]:break-normal [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-3 [&_li_a]:[overflow-wrap:anywhere]`}
    >
      <Markdown
        options={{
          disableParsingRawHTML: true,
          overrides: {
            h2: {
              component: ({ children: heading }: { children?: ReactNode }) => (
                <h2 id={blogHeadingId(String(heading))} tabIndex={-1}>
                  {heading}
                </h2>
              ),
            },
            a: {
              component: ({
                href = "",
                children: label,
                ...attributes
              }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
                <PreviewLink
                  href={href}
                  resolveLink={resolveLink}
                  {...attributes}
                  {...(/^https?:\/\//.test(href)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {label}
                  {/^https?:\/\//.test(href) && (
                    <span className="sr-only">
                      {" "}
                      (откроется в новой вкладке)
                    </span>
                  )}
                </PreviewLink>
              ),
            },
          },
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
