import { IComponentPropsExtended } from "../interface";
import { Component as NotificationModuleWidget } from "@sps/notification/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <NotificationModuleWidget
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
            <NotificationModuleWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </NotificationModuleWidget>
  );
}
