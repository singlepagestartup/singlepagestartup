import { IComponentPropsExtended } from "../interface";
import { Component as RbacWidget } from "@sps/rbac/models/widget/frontend/component";
import { Component as SubjectWidget } from "./subject/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <RbacWidget
      isServer={props.isServer}
      hostUrl={props.hostUrl}
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
            <RbacWidget
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant={entity.variant as any}
              data={entity}
            >
              {entity.variant.startsWith("subject") ? (
                <SubjectWidget
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant={entity.variant as any}
                  data={entity}
                />
              ) : null}
            </RbacWidget>
          );
        });
      }}
    </RbacWidget>
  );
}
