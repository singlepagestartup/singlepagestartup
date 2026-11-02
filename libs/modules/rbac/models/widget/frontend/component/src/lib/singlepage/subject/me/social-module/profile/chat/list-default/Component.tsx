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
            data.map((link) => (
              <WidgetsToWebsiteBuilderModuleWidgets
                key={link.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={link}
                language={props.language}
              >
                <Content
                  language={props.language || "en"}
                  socialModuleChatId={props.socialModuleChatId}
                  socialModuleThreadId={props.socialModuleThreadId}
                />
              </WidgetsToWebsiteBuilderModuleWidgets>
            ))
          ) : (
            <p role="alert">Chat presentation is unavailable.</p>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
