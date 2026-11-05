import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-id={data.id}
      data-variant={props.variant}
      className={cn("w-full min-w-0", data.className, props.className)}
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
              articleVariant="overview-default"
            />
          ))
        }
      </WidgetsToArticles>
    </div>
  );
}
