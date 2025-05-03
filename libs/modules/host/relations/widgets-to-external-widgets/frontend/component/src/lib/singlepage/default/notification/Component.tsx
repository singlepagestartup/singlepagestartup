import { IComponentPropsExtended } from "../interface";
import { Component as Notification } from "@sps/notification/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <Notification
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
            <Notification
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </Notification>
  );
}
