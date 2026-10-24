import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as CategoriesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/categories-to-website-builder-module-widgets/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Icon } from "@sps/ui-adapter";
export function Component(props: IComponentPropsExtended) {
  return (
    <section
      data-module="blog"
      data-model="category"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-12",
        props.data.className,
        props.className,
      )}
    >
      <header className="max-w-3xl">
        <Link
          href={saveLanguageContext(
            "/blog",
            props.language,
            internationalization.languages,
          )}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Icon name="arrow-right" className="rotate-180" />
          {props.language === "ru" ? "Все статьи" : "All articles"}
        </Link>
        <p className="mt-6 text-sm font-medium text-muted-foreground">
          {props.language === "ru" ? "Статьи по теме" : "Read by subject"}
        </p>
        <h1 className="mt-3 break-words text-4xl font-semibold tracking-normal sm:text-5xl">
          {props.data.title?.[props.language] || props.data.title?.en}
        </h1>
        {props.data.subtitle?.[props.language] || props.data.subtitle?.en ? (
          <TipTap
            value={
              props.data.subtitle?.[props.language] ||
              props.data.subtitle?.en ||
              ""
            }
            className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground"
          />
        ) : null}
      </header>
      {props.data.description?.[props.language] ||
      props.data.description?.en ? (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <TipTap
            value={
              props.data.description?.[props.language] ||
              props.data.description?.en ||
              ""
            }
          />
        </div>
      ) : null}
      <CategoriesToWebsiteBuilderModuleWidgets
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
        {({ data }) =>
          data?.map((link) => (
            <CategoriesToWebsiteBuilderModuleWidgets
              key={link.id}
              isServer={props.isServer}
              variant="default"
              dataSource="props"
              data={link}
              language={props.language}
            />
          ))
        }
      </CategoriesToWebsiteBuilderModuleWidgets>
      <section className="space-y-5">
        <h2 className="break-words text-2xl font-semibold">
          {props.language === "ru"
            ? "Статьи в категории"
            : "Articles in this category"}
        </h2>
        <CategoriesToArticles
          isServer={props.isServer}
          variant="find"
          skeleton={
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Article key={i} isServer={props.isServer} variant="loading" />
              ))}
            </div>
          }
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
          {({ data }) =>
            data?.length ? (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  {props.language === "ru"
                    ? `Статей: ${data.length}`
                    : `${data.length} articles`}
                </p>
                <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.map((link) => (
                    <CategoriesToArticles
                      key={link.id}
                      isServer={props.isServer}
                      variant="default"
                      dataSource="props"
                      data={link}
                      language={props.language}
                      renderAuthor={props.renderAuthor}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {props.language === "ru"
                  ? "В этой категории пока нет статей."
                  : "There are no articles in this category yet."}
              </p>
            )
          }
        </CategoriesToArticles>
      </section>
      {props.children}
    </section>
  );
}
