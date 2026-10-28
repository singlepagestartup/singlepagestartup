"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import type { IArticleHeading, IClientComponentProps } from "./interface";

/** Public-body headings are observed after TipTap renders; protected children stay outside this scope. */
export function Component(props: IClientComponentProps) {
  const body = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<IArticleHeading[]>([]);
  useEffect(() => {
    const root = body.current;
    if (!root) return;
    function readHeadings() {
      const entries = [...root!.querySelectorAll<HTMLElement>("h2,h3")]
        .map((heading, index) => {
          const id = `article-${props.articleId}-section-${index}`;
          return { id, title: heading.textContent?.trim() ?? "" };
        })
        .filter((heading) => heading.title);
      setHeadings((current) =>
        current.length === entries.length &&
        current.every(
          (heading, index) =>
            heading.id === entries[index].id &&
            heading.title === entries[index].title,
        )
          ? current
          : entries,
      );
    }
    readHeadings();
    const observer = new MutationObserver(readHeadings);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [props.articleId, props.body, props.publicContent]);
  function readSection(id: string) {
    const index = headings.findIndex((heading) => heading.id === id);
    const heading = [
      ...(body.current?.querySelectorAll<HTMLElement>("h2,h3") ?? []),
    ].filter((element) => element.textContent?.trim())[index];
    if (!heading) return;
    heading.tabIndex = -1;
    heading.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  }
  const ru = props.language === "ru";
  return (
    <article
      data-module="blog"
      data-model="article"
      data-id={props.articleId}
      data-variant={props.variant}
      className={cn(
        "mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-5 py-8 lg:gap-10 lg:px-8 lg:py-12",
        props.className,
      )}
    >
      <header className="min-w-0 max-w-4xl">
        <nav
          aria-label={ru ? "Навигация статьи" : "Article breadcrumb"}
          className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
        >
          <Link
            href={saveLanguageContext(
              "/blog",
              props.language,
              internationalization.languages,
            )}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg hover:underline ${focus}`}
          >
            <Icon name="arrow-right" className="rotate-180" />
            {ru ? "Блог фреймворка" : "The Framework journal"}
          </Link>
          {props.categories}
        </nav>
        <h1 className="mt-6 text-balance break-words text-3xl font-semibold leading-tight tracking-normal sm:text-4xl lg:text-5xl">
          {props.title}
        </h1>
        {props.subtitle && (
          <div className="mt-5 max-w-3xl">{props.subtitle}</div>
        )}
        {(props.author || props.dateLabel) && (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            {props.author}
            {props.dateLabel && (
              <time
                dateTime={props.dateTime}
                className="text-xs text-muted-foreground"
              >
                {props.dateLabel}
              </time>
            )}
          </div>
        )}
      </header>
      <div
        className={cn(
          "grid min-w-0 items-start gap-6 lg:gap-10",
          (headings.length > 0 || props.authorCard) &&
            "lg:grid-cols-[minmax(0,1fr)_256px]",
        )}
      >
        <div className="min-w-0 space-y-8">
          <div ref={body} className="min-w-0 space-y-8">
            <div className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-8">
              {props.media}
              {props.body && (
                <div className="mt-8 min-w-0 break-words [&_a]:[overflow-wrap:anywhere] [&_h2]:scroll-mt-28 [&_h3]:scroll-mt-28 [&_pre]:max-w-full [&_pre]:overflow-x-auto">
                  {props.body}
                </div>
              )}
            </div>
            {props.publicContent}
          </div>
          {props.content}
          {props.commentsContent}
        </div>
        {(headings.length > 0 || props.authorCard) && (
          <aside
            aria-label={ru ? "Материалы статьи" : "Article resources"}
            className="order-first min-w-0 space-y-6 lg:order-last"
          >
            {headings.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold">
                  {ru ? "В этой статье" : "In this guide"}
                </h2>
                <nav
                  aria-label={ru ? "Содержание статьи" : "In this guide"}
                  className="mt-3 grid gap-1"
                >
                  {headings.map((heading) => (
                    <button
                      type="button"
                      key={heading.id}
                      onClick={() => readSection(heading.id)}
                      className={`min-h-11 rounded-lg py-2 text-left text-sm leading-6 text-muted-foreground hover:underline ${focus}`}
                    >
                      {heading.title}
                    </button>
                  ))}
                </nav>
              </section>
            )}
            {props.authorCard}
          </aside>
        )}
      </div>
      {props.navigation}
    </article>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
