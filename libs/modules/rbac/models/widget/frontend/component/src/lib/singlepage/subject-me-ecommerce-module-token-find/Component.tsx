import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as Content } from "./Content";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || "en";
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={props.variant}
      data-id={props.data.id}
      className="w-full min-w-0"
    >
      <WidgetsToWebsiteBuilderModuleWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "widgetId", method: "eq", value: props.data.id },
                { column: "variant", method: "eq", value: "default" },
              ],
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
              language={language}
            >
              <Content
                widgetId={props.data.id}
                isServer={props.isServer}
                language={language}
              />
            </WidgetsToWebsiteBuilderModuleWidgets>
          ) : (
            <p role="alert" className="p-6 text-sm text-muted-foreground">
              {language === "ru"
                ? "Каталог токенов временно недоступен."
                : "The token catalogue is currently unavailable."}
            </p>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
