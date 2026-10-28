import type { IFrameworkPageViewProps } from "../interface";
import { Icon, kit } from "../primitives";
import { PreviewLink, SiteShell, siteStyles } from "../Site";
import {
  articles,
  blogRouteSlug,
  categories,
  categoryCopy,
  parseBlogDocument,
} from "./content";
import { ArticleCard, BlogPreparation, CategoryLinks } from "./components";

export default function BlogCategory({
  text,
  navigationHref,
  resolveLink,
}: IFrameworkPageViewProps) {
  const copy = {
    ...categoryCopy,
    ...(text ? parseBlogDocument(text).meta : {}),
  };
  const slug = blogRouteSlug(
    navigationHref,
    "categories",
    copy.defaultCategory,
  );
  const category = categories.find((item) => item.slug === slug);
  const collection = articles.filter(
    (article) => article.category === category?.slug,
  );
  return (
    <SiteShell resolveLink={resolveLink} active="blog">
      <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-8 @3xl:gap-14 @3xl:px-8 @3xl:py-12">
        <header>
          <PreviewLink
            href="/blog"
            resolveLink={resolveLink}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium hover:underline ${siteStyles.focus}`}
          >
            <Icon name="arrow-left" size={20} />
            {copy.backLabel}
          </PreviewLink>
          <p className={`mt-6 text-sm font-medium ${siteStyles.muted}`}>
            {copy.eyebrow}
          </p>
          <h1
            className={`mt-3 text-balance text-4xl leading-tight @3xl:text-5xl ${siteStyles.display}`}
          >
            {category?.title ?? copy.notFoundTitle}
          </h1>
          <p className={`mt-4 max-w-2xl text-lg leading-8 ${siteStyles.muted}`}>
            {category?.description ?? copy.notFoundDescription}
          </p>
          {category && (
            <p className={`mt-5 text-sm ${siteStyles.muted}`}>
              {collection.length} {copy.countLabel}
            </p>
          )}
        </header>
        {category ? (
          <section
            aria-label={category.title}
            className="grid items-stretch gap-5 @2xl:grid-cols-2"
          >
            {collection.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                resolveLink={resolveLink}
              />
            ))}
          </section>
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
        <section>
          <h2 className={`mb-5 text-2xl ${siteStyles.display}`}>
            {copy.relatedTitle}
          </h2>
          <CategoryLinks
            items={categories.filter((item) => item.slug !== category?.slug)}
            resolveLink={resolveLink}
          />
        </section>
        <BlogPreparation resolveLink={resolveLink} />
      </main>
    </SiteShell>
  );
}
