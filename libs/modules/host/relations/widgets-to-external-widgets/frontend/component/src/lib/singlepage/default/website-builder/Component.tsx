import { IComponentPropsExtended } from "../interface";
import { Component as WebsiteBuilder } from "@sps/website-builder/models/widget/frontend/component";
import { Component as RbacProfileButtonDefault } from "../rbac/profile-button-default/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <WebsiteBuilder
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
            <WebsiteBuilder
              key={widget.id}
              isServer={props.isServer}
              data={widget}
              variant={widget.variant as any}
            >
              {widget.variant.includes("navbar") ? (
                <RbacProfileButtonDefault isServer={props.isServer} />
              ) : null}
            </WebsiteBuilder>
          );
        });
      }}
    </WebsiteBuilder>
  );
}
