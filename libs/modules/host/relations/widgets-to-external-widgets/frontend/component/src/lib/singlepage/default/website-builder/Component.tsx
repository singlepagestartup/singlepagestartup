import { IComponentPropsExtended } from "../interface";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";
import { Component as Widget } from "./widget";

export function Component(props: IComponentPropsExtended) {
  return (
    <WebsiteBuilderModuleWidget
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.externalWidgetId,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((entity) => {
          return (
            <WebsiteBuilderModuleWidget
              key={entity.id}
              isServer={props.isServer}
              data={entity}
              variant={entity.variant as any}
              language={props.language}
              {...(entity.variant === "navbar-ai-chat"
                ? { helpSelected: props.url === "/ai-chat/help" }
                : {})}
            >
              <Widget
                {...props}
                data={entity}
                variant={entity.variant as any}
              />
            </WebsiteBuilderModuleWidget>
          );
        });
      }}
    </WebsiteBuilderModuleWidget>
  );
}
