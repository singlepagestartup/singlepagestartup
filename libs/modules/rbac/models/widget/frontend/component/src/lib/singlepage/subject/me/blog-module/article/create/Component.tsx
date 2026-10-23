import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as Content } from "./Content";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className="w-full min-w-0"
    >
      <WidgetsToWebsiteBuilderModuleWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length === 1 ? (
            <WidgetsToWebsiteBuilderModuleWidgets
              isServer={props.isServer}
              variant="default"
              dataSource="props"
              data={data[0]}
              language={props.language}
            >
              <Content language={props.language} />
            </WidgetsToWebsiteBuilderModuleWidgets>
          ) : (
            <p role="alert">
              {props.language === "ru"
                ? "Форма публикации временно недоступна."
                : "The publication form is currently unavailable."}
            </p>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
