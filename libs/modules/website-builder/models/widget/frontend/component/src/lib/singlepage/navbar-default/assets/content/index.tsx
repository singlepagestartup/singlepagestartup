import { IComponentPropsExtended } from "../../interface";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="flex flex-col lg:flex-row w-full px-2 lg:px-0 items-center justify-between gap-2">
      <WidgetsToButtonsArrays
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
              <WidgetsToButtonsArrays
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </WidgetsToButtonsArrays>
    </div>
  );
}
