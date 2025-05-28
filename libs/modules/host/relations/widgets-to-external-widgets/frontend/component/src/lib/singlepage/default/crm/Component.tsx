import { IComponentPropsExtended } from "../interface";
import { Component as CrmModuleWidget } from "@sps/crm/models/widget/frontend/component";
import { Component as Widget } from "./widget";

export function Component(props: IComponentPropsExtended) {
  return (
    <CrmModuleWidget
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
            <CrmModuleWidget
              key={index}
              isServer={props.isServer}
              data={entity}
              language={props.language}
              variant={entity.variant as any}
            >
              <Widget {...props} data={entity} variant={entity.variant} />
            </CrmModuleWidget>
          );
        });
      }}
    </CrmModuleWidget>
  );
}
