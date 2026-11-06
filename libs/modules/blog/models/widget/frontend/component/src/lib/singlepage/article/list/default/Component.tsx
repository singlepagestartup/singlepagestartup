import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/widgets-to-website-builder-module-widgets/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const loading = (
    <div className="col-span-full grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Article key={index} isServer={props.isServer} variant="loading" />
      ))}
    </div>
  );
  const rows = (
    <WidgetsToArticles
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
          links.map((link) => (
            <WidgetsToArticles
              key={link.id}
              isServer={props.isServer}
              variant="default"
              articleVariant="default"
              dataSource="props"
              data={link}
              language={props.language}
              renderAuthor={props.renderAuthor}
            />
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground">
            {props.language === "ru" ? "Пока ничего нет." : "Nothing here yet."}
          </p>
        )
      }
    </WidgetsToArticles>
  );
  return (
    <section
      data-module="blog"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("w-full min-w-0", props.className)}
    >
      <WidgetsToWebsiteBuilderModuleWidgets
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
        {({ data: frames }) =>
          frames?.length ? (
            frames.map((frame) => (
              <WidgetsToWebsiteBuilderModuleWidgets
                key={frame.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={frame}
                language={props.language}
              >
                {rows}
              </WidgetsToWebsiteBuilderModuleWidgets>
            ))
          ) : (
            <div
              className={cn(
                "mx-auto w-full min-w-0 max-w-7xl space-y-5 px-5 py-8 lg:px-8 lg:py-12",
                props.data.className,
              )}
            >
              <header className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
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
              <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rows}
              </div>
            </div>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </section>
  );
}
