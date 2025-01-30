import { IComponentPropsExtended } from "../../interface";
import { Component as WidgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="w-fit">
      <WidgetsToLogotypes
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "widgetId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <WidgetsToLogotypes
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </WidgetsToLogotypes>
    </div>
  );
}
