import { IComponentPropsExtended } from "../interface";
import { Component as AgentModuleWidget } from "@sps/agent/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <AgentModuleWidget
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
            <AgentModuleWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </AgentModuleWidget>
  );
}
