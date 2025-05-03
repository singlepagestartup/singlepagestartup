import { IComponentPropsExtended } from "../interface";
import { Component as FileStorage } from "@sps/file-storage/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <FileStorage
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
            <FileStorage
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </FileStorage>
  );
}
