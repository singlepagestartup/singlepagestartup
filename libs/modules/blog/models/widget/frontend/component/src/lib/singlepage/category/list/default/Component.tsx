import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as Category } from "@sps/blog/models/category/frontend/component";
import { Component as WidgetsToCategories } from "@sps/blog/relations/widgets-to-categories/frontend/component";
export function Component(props: IComponentPropsExtended) {
  const loading = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Category key={i} isServer={props.isServer} variant="loading" />
      ))}
    </div>
  );
  return (
    <section
      data-module="blog"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-5 px-4 py-8 sm:px-6 sm:py-12 lg:px-8",
        props.data.className,
        props.className,
      )}
    >
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {props.data.title?.[props.language] || props.data.title?.en}
        </h2>
        {props.data.description?.[props.language] ||
        props.data.description?.en ? (
          <TipTap
            value={
              props.data.description?.[props.language] ||
              props.data.description?.en ||
              ""
            }
            className="text-sm leading-6 text-muted-foreground"
          />
        ) : null}
      </header>
      <WidgetsToCategories
        isServer={props.isServer}
        variant="find"
        skeleton={loading}
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
            orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
          },
        }}
      >
        {({ data: links }) =>
          links?.length ? (
            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <WidgetsToCategories
                  key={link.id}
                  isServer={props.isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={props.language}
                />
              ))}
            </div>
          ) : (
            <Category
              isServer={props.isServer}
              variant="find"
              skeleton={loading}
            >
              {({ data }) =>
                data?.length ? (
                  <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {data.map((entity) => (
                      <Category
                        key={entity.id}
                        isServer={props.isServer}
                        variant="default"
                        dataSource="props"
                        data={entity}
                        language={props.language}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {props.language === "ru"
                      ? "Пока ничего нет."
                      : "Nothing here yet."}
                  </p>
                )
              }
            </Category>
          )
        }
      </WidgetsToCategories>
    </section>
  );
}
