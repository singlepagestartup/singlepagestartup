import { IComponentPropsExtended } from "../interface";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";
import { Component as RbacSubject } from "../rbac/subject/Component";

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
        return data?.map((widget) => {
          return (
            <WebsiteBuilderModuleWidget
              key={widget.id}
              isServer={props.isServer}
              data={widget}
              variant={widget.variant as any}
              language={props.language}
            >
              {widget.variant.includes("navbar") ? (
                <RbacSubject
                  isServer={props.isServer}
                  language={props.language}
                  variant="me-ecommerce-order-list-default"
                />
              ) : null}
            </WebsiteBuilderModuleWidget>
          );
        });
      }}
    </WebsiteBuilderModuleWidget>
  );
}
