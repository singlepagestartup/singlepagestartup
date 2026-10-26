import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/widgets-to-website-builder-module-widgets/frontend/component";
import type { IPresentationProps } from "./interface";
export function Presentation(props: IPresentationProps) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;
  const rows = (
    <div
      className={cn(
        "grid w-full items-stretch gap-4",
        props.layout === "guide"
          ? "@2xl:grid-cols-2 @5xl:grid-cols-3"
          : "@xl:grid-cols-2 @4xl:grid-cols-4",
      )}
    >
      <WidgetsToArticles
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: data.id }],
            },
            orderBy: {
              and: [
                { column: "orderIndex", method: "asc" },
                { column: "id", method: "asc" },
              ],
            },
          },
        }}
      >
        {({ data: links }) =>
          links?.map((link, index) => (
            <WidgetsToArticles
              key={link.id}
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={link}
              language={language}
              className="block min-w-0"
              cardLayout={props.layout}
              articleVariant="card"
            />
          ))
        }
      </WidgetsToArticles>
    </div>
  );
  return (
    <section
      data-module="blog"
      data-model="widget"
      data-id={data.id}
      data-variant={props.variant}
      className={cn(
        "@container w-full min-w-0",
        data.className,
        props.className,
      )}
    >
      <WidgetsToWebsiteBuilderModuleWidgets
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: data.id }],
            },
            orderBy: {
              and: [
                { column: "orderIndex", method: "asc" },
                { column: "id", method: "asc" },
              ],
            },
          },
        }}
      >
        {({ data: frames }) =>
          frames?.length ? (
            frames.map((frame) => (
              <WidgetsToWebsiteBuilderModuleWidgets
                key={frame.id}
                isServer={isServer}
                variant="default"
                dataSource="props"
                data={frame}
                language={language}
              >
                {rows}
              </WidgetsToWebsiteBuilderModuleWidgets>
            ))
          ) : (
            <div className="mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20">
              <h2 className="mb-8 text-3xl font-semibold">{title}</h2>
              {rows}
            </div>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </section>
  );
}
export function Component(props: IComponentPropsExtended) {
  return (
    <Presentation
      data={props.data}
      language={props.language}
      isServer={props.isServer}
      className={props.className}
      variant="article-find-grid"
      layout="module"
    />
  );
}
