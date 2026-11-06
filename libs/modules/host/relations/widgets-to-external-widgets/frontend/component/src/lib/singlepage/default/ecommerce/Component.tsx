import { IExternalWidgetProps } from "../interface";
import { Component as EcommerceModuleWidget } from "@sps/ecommerce/models/widget/frontend/component";

export function Component(
  props: IExternalWidgetProps & {
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
        return data?.map((entity) => {
          return (
            <EcommerceModuleWidget
              key={entity.id}
              isServer={props.isServer}
              variant={entity.variant as any}
              dataSource="props"
              data={entity}
              language={props.language}
            />
          );
        });
      }}
    </EcommerceModuleWidget>
  );
}
