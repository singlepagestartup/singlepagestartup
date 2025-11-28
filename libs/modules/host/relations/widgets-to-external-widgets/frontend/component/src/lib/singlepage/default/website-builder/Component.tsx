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
        return data?.map((entity, index) => {
          return (
            <WebsiteBuilderModuleWidget
              key={index}
              isServer={props.isServer}
              data={entity}
              variant={entity.variant as any}
              language={props.language}
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
