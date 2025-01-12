import { IComponentPropsExtended } from "../interface";
import { Component as Startup } from "@sps/startup/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <Startup
      isServer={props.isServer}
      hostUrl={props.hostUrl}
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
            <Startup
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </Startup>
  );
}
