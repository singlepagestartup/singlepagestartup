import { IComponentPropsExtended } from "../interface";
import { Component as AnalyticModuleWidget } from "@sps/analytic/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <AnalyticModuleWidget
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
            <AnalyticModuleWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </AnalyticModuleWidget>
  );
}
