import { IComponentPropsExtended } from "../interface";
import { Component as EcommerceModuleWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as Widget } from "./widget";

export function Component(
  props: IComponentPropsExtended & {
    language: string;
  },
) {
  return (
    <EcommerceModuleWidget
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
            <EcommerceModuleWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
              language={props.language}
            >
              <Widget {...props} data={entity} variant={entity.variant} />
            </EcommerceModuleWidget>
          );
        });
      }}
    </EcommerceModuleWidget>
  );
}
