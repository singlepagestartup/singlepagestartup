import { IComponentPropsExtended } from "../interface";
import { Component as CrmWidget } from "@sps/crm/models/widget/frontend/component";
import { Component as Form } from "./form/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <CrmWidget
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
            <CrmWidget
              key={entity.id}
              isServer={props.isServer}
              data={entity}
              variant={entity.variant as any}
              language={props.language}
            >
              {entity.variant.startsWith("form") ? (
                <Form
                  url={props.url}
                  isServer={props.isServer}
                  data={entity}
                  language={props.language}
                  variant={entity.variant}
                />
              ) : null}
            </CrmWidget>
          );
        });
      }}
    </CrmWidget>
  );
}
