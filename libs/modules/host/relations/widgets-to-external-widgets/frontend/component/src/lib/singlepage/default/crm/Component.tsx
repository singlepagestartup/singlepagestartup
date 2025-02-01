import { IComponentPropsExtended } from "../interface";
import { Component as Crm } from "@sps/crm/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <Crm
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
        return data?.map((widget) => {
          return (
            <Crm
              key={widget.id}
              isServer={props.isServer}
              data={widget}
              variant={widget.variant as any}
              language={props.language}
            />
          );
        });
      }}
    </Crm>
  );
}
