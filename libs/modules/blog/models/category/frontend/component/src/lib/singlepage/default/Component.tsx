import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { ArrowRight } from "lucide-react";
import { Cover } from "./Cover";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const href = saveLanguageContext(
    `/blog/categories/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );
  const title =
    props.data.title?.[props.language]?.trim() || props.data.title?.en?.trim();
  return (
    <article
      data-module="blog"
      data-model="category"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground motion-reduce:transition-none",
        props.data.className,
        props.className,
      )}
    >
      <CategoriesToArticles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "categoryId", method: "eq", value: props.data.id },
              ],
            },
            orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
          },
        }}
      >
        {({ data: links }) => (
          <>
            {links?.[0] ? (
              <Cover
                isServer={props.isServer}
                language={props.language}
                articleId={links[0].articleId}
              />
            ) : null}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-xl font-semibold leading-6 tracking-tight">
                  <Link
                    href={href}
                    aria-label={
                      title ||
                      (props.language === "ru"
                        ? "Открыть категорию"
                        : "Explore category")
                    }
                    className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-foreground"
                  >
                    {title}
                  </Link>
                </h3>
                {links ? (
                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {props.language === "ru"
                      ? `Статей: ${links.length}`
                      : `${links.length} articles`}
                  </span>
                ) : null}
              </div>
              {props.data.subtitle?.[props.language] ||
              props.data.subtitle?.en ? (
                <TipTap
                  value={
                    props.data.subtitle?.[props.language] ||
                    props.data.subtitle?.en ||
                    ""
                  }
                  className="text-sm leading-6 text-muted-foreground [&_a]:relative [&_a]:z-10"
                />
              ) : null}
              {props.children ? (
                <div className="[&_a]:relative [&_a]:z-10 [&_button]:relative [&_button]:z-10">
                  {props.children}
                </div>
              ) : null}
              <span
                aria-hidden="true"
                className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 pt-3 text-sm font-medium"
              >
                {props.language === "ru"
                  ? "Открыть категорию"
                  : "Explore category"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </>
        )}
      </CategoriesToArticles>
    </article>
  );
});
