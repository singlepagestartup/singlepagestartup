import { IComponentPropsExtended } from "../interface";
import { Component as SocialModuleWidget } from "@sps/social/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <SocialModuleWidget
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
            <SocialModuleWidget
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </SocialModuleWidget>
  );
}
