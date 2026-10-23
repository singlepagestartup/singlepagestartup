import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as CategoriesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/categories-to-website-builder-module-widgets/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
export function Component(props: IComponentPropsExtended) {
  return (
    <section
      data-module="blog"
      data-model="category"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8",
        props.data.className,
        props.className,
      )}
    >
      <header className="rounded-3xl bg-default p-6 text-default-foreground sm:p-10">
        <h1 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">
          {props.data.title?.[props.language] || props.data.title?.en}
        </h1>
        {props.data.subtitle?.[props.language] || props.data.subtitle?.en ? (
          <TipTap
            value={
              props.data.subtitle?.[props.language] ||
              props.data.subtitle?.en ||
              ""
            }
            className="mt-5 max-w-2xl text-lg leading-8 text-default-muted-foreground"
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
