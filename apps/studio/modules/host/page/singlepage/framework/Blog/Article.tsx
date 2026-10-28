import type { ReactNode } from "react";
import type { IFrameworkPageViewProps } from "../interface";
import { Icon, kit } from "../primitives";
import { PreviewLink, SiteShell, siteStyles } from "../Site";
import {
  articleCopy,
  articles,
  blogCopy,
  blogCover,
  blogHeadings,
  blogRouteSlug,
  categories,
  formatBlogDate,
  parseBlogArticle,
  parseBlogDocument,
} from "./content";
import { BlogPreparation, ContentsLink, MarkdownBody } from "./components";

export default function BlogArticle({
  text,
  navigationHref,
  resolveLink,
  discussion,
}: IFrameworkPageViewProps & { discussion?: ReactNode }) {
  const edited = text ? parseBlogDocument(text) : undefined;
  const copy = { ...articleCopy, ...edited?.meta };
  const slug = blogRouteSlug(
    navigationHref,
    "articles",
    edited?.meta.slug ?? copy.defaultArticle,
  );
  const selected = articles.find((item) => item.slug === slug);
  const article =
    selected && edited?.meta.slug === slug && text
      ? parseBlogArticle(text)
      : selected;
  const category = categories.find((item) => item.slug === article?.category);
  const current = articles.findIndex((item) => item.slug === article?.slug);
  const previous = current > 0 ? articles[current - 1] : undefined;
  const next = current >= 0 ? articles[current + 1] : undefined;
  const headings = article ? blogHeadings(article.body) : [];

  return (
    <SiteShell resolveLink={resolveLink} active="blog">
      <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-8 @3xl:gap-14 @3xl:px-8 @3xl:py-12">
        <header className="max-w-4xl">
          <nav
            aria-label="Навигационная цепочка"
            className={`flex flex-wrap items-center gap-2 text-sm ${siteStyles.muted}`}
          >
            <PreviewLink
              href="/blog"
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg hover:underline ${siteStyles.focus}`}
            >
              <Icon name="arrow-left" size={20} />
              {copy.backLabel}
            </PreviewLink>
            {category && (
              <>
                <span aria-hidden="true">/</span>
                <PreviewLink
                  href={`/blog/categories/${category.slug}`}
                  resolveLink={resolveLink}
                  className={`inline-flex min-h-11 items-center rounded-lg hover:underline ${siteStyles.focus}`}
                >
                  {category.title}
                </PreviewLink>
              </>
            )}
          </nav>
          <h1
            className={`mt-6 text-balance text-3xl leading-tight @2xl:text-4xl @4xl:text-5xl ${siteStyles.display}`}
          >
            {article?.title ?? copy.notFoundTitle}
          </h1>
          <p className={`mt-5 text-lg leading-8 ${siteStyles.muted}`}>
            {article?.excerpt ?? copy.notFoundDescription}
          </p>
          {article && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="font-medium">{article.author}</p>
                <p className={`mt-1 text-xs ${siteStyles.muted}`}>
                  {article.authorRole}
                </p>
              </div>
              {article.createdAt && (
                <time dateTime={article.createdAt} className={siteStyles.muted}>
                  {formatBlogDate(article.createdAt)}
                </time>
              )}
              <p
                className={`inline-flex items-center gap-2 ${siteStyles.muted}`}
              >
                <Icon name="clock" size={20} />
                {article.minutes} {blogCopy.minuteLabel}
              </p>
            </div>
          )}
        </header>
        {article ? (
          <>
            <div className="grid min-w-0 gap-8 @4xl:grid-cols-[minmax(0,1fr)_15rem] @5xl:gap-12">
              <article className="min-w-0 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 @2xl:p-8">
                <img
                  src={blogCover(article.cover)}
                  alt={article.coverAlt}
                  width={1254}
                  height={1254}
                  className="mx-auto mb-8 aspect-square w-full max-w-lg rounded-2xl object-cover"
                />
                <MarkdownBody resolveLink={resolveLink}>
                  {article.body}
                </MarkdownBody>
              </article>
              <aside className="order-first min-w-0 @4xl:order-last">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 @4xl:sticky @4xl:top-28">
                  <h2 className="text-sm font-semibold">
                    {copy.contentsLabel}
                  </h2>
                  <nav
                    aria-label={copy.contentsLabel}
                    className={`mt-3 ${siteStyles.muted}`}
                  >
                    {headings.map((heading) => (
                      <ContentsLink key={heading.id} href={`#${heading.id}`}>
                        {heading.title}
                      </ContentsLink>
                    ))}
                  </nav>
                </div>
              </aside>
            </div>
            {(previous || next) && (
              <section
                aria-label={copy.relatedTitle}
                className="grid gap-4 @2xl:grid-cols-2"
              >
                {previous && (
                  <PreviewLink
                    href={`/blog/articles/${previous.slug}`}
                    resolveLink={resolveLink}
                    className={`${kit.card} group block p-6 ${siteStyles.focus}`}
                  >
                    <span
                      className={`inline-flex items-center gap-2 text-sm ${siteStyles.muted}`}
                    >
                      <Icon name="arrow-left" size={20} />
                      {copy.previousLabel}
                    </span>
                    <h2
                      className={`mt-3 text-lg leading-7 group-hover:underline ${siteStyles.display}`}
                    >
                      {previous.title}
                    </h2>
                  </PreviewLink>
                )}
                {next && (
                  <PreviewLink
                    href={`/blog/articles/${next.slug}`}
                    resolveLink={resolveLink}
                    className={`${kit.card} group block p-6 ${siteStyles.focus}`}
                  >
                    <span
                      className={`inline-flex items-center gap-2 text-sm ${siteStyles.muted}`}
                    >
                      {copy.nextLabel}
                      <Icon name="arrow-right" size={20} />
                    </span>
                    <h2
                      className={`mt-3 text-lg leading-7 group-hover:underline ${siteStyles.display}`}
                    >
                      {next.title}
                    </h2>
                  </PreviewLink>
                )}
              </section>
            )}
          </>
        ) : (
          <div>
            <PreviewLink
              href="/blog"
              resolveLink={resolveLink}
              className={kit.button}
            >
              {copy.backLabel}
            </PreviewLink>
          </div>
        )}
        {article && discussion}
        <BlogPreparation resolveLink={resolveLink} />
      </main>
    </SiteShell>
  );
}
