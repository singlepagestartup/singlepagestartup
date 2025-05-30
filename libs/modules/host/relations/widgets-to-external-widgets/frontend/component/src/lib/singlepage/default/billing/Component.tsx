import { IComponentPropsExtended } from "../interface";
import { Component as BillingModuleWidget } from "@sps/billing/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <BillingModuleWidget
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
            <BillingModuleWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </BillingModuleWidget>
  );
}
