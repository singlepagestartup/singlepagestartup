"use client";

import { useId, useMemo, useState } from "react";
import type { IFrameworkPageViewProps } from "../interface";
import { Icon, kit } from "../primitives";
import { SiteShell, siteStyles } from "../Site";
import {
  articles,
  blogCopy,
  categories,
  parseBlogCategories,
  parseBlogDocument,
  selectBlogArticles,
} from "./content";
import { ArticleCard, BlogPreparation, CategoryLinks } from "./components";

export default function BlogIndex({
  text,
  resolveLink,
}: IFrameworkPageViewProps) {
  const document = text ? parseBlogDocument(text) : undefined;
  const copy = { ...blogCopy, ...document?.meta };
  const editedCategories = text ? parseBlogCategories(text) : [];
  const categoryOptions = editedCategories.length
    ? editedCategories
    : categories;
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const searchId = useId();
  const filtered = useMemo(
    () => selectBlogArticles(articles, category, query),
    [category, query],
  );
  const clear = () => {
    setCategory("all");
    setQuery("");
  };

  return (
    <SiteShell resolveLink={resolveLink} active="blog">
      <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-8 @3xl:gap-14 @3xl:px-8 @3xl:py-12">
        <header className="max-w-3xl">
          <p className={`text-sm font-medium ${siteStyles.muted}`}>
            {copy.eyebrow}
          </p>
          <h1
            className={`mt-4 text-balance text-4xl leading-[1.12] @3xl:text-5xl ${siteStyles.display}`}
          >
            {copy.title}
          </h1>
          <p
            className={`mt-5 max-w-2xl text-base leading-7 @3xl:text-lg ${siteStyles.muted}`}
          >
            {copy.description}
          </p>
        </header>
        <section aria-labelledby="blog-subjects">
          <h2
            id="blog-subjects"
            className={`mb-4 text-lg ${siteStyles.display}`}
          >
            {copy.categoriesLabel}
          </h2>
          <CategoryLinks items={categoryOptions} resolveLink={resolveLink} />
        </section>
        <section aria-label={copy.allCategories} className="min-w-0">
          <div className="grid gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 @4xl:grid-cols-[1fr_20rem] @4xl:items-end @4xl:p-5">
            <fieldset className="min-w-0">
              <legend className="sr-only">{copy.filterLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {[
                  { slug: "all", title: copy.allCategories },
                  ...categoryOptions,
                ].map((option) => (
                  <button
                    key={option.slug}
                    type="button"
                    aria-pressed={category === option.slug}
                    onClick={() => setCategory(option.slug)}
                    className={`${kit.secondary} relative whitespace-normal border-transparent px-4 pb-4 ${category === option.slug ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" : siteStyles.muted}`}
                  >
                    {option.title}
                    {category === option.slug && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[hsl(var(--primary))]"
                      />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="min-w-0">
              <label htmlFor={searchId} className="sr-only">
                {copy.searchLabel}
              </label>
              <div className="relative min-w-0">
                <span
                  className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${siteStyles.muted}`}
                >
                  <Icon name="magnifying-glass" size={20} />
                </span>
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className={`${kit.field} pl-12`}
                />
              </div>
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            className={`my-5 text-sm ${siteStyles.muted}`}
          >
            {filtered.length} {copy.resultsLabel}
          </p>
          {filtered.length ? (
            <div className="grid items-stretch gap-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {filtered.map((article) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  resolveLink={resolveLink}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] px-5 py-12 text-center">
              <h2 className={`text-2xl ${siteStyles.display}`}>
                {copy.emptyTitle}
              </h2>
              <p
                className={`mx-auto mt-3 max-w-md text-base leading-7 ${siteStyles.muted}`}
              >
                {copy.emptyDescription}
              </p>
              <button
                type="button"
                onClick={clear}
                className={`${kit.secondary} mt-6`}
              >
                {copy.clearLabel}
              </button>
            </div>
          )}
        </section>
        <BlogPreparation resolveLink={resolveLink} />
      </main>
    </SiteShell>
  );
}
