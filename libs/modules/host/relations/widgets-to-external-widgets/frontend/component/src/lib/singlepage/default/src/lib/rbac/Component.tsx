import { IComponentPropsExtended } from "../interface";
import { Component as RbacWidget } from "@sps/rbac/models/widget/frontend/component";
import { Component as IdentitiesUpdateDefault } from "./identities-update-default/Component";
import { Component as SubjectOverviewDefault } from "./subject-overview-default/Component";
import { Component as SubjectsListDefault } from "./subjects-list-default/Component";

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
          if (entity.variant === "identities-update-default") {
            return (
              <RbacWidget
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant={entity.variant as any}
                data={entity}
              >
                <IdentitiesUpdateDefault
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  key={index}
                />
              </RbacWidget>
            );
          }

          if (entity.variant === "subject-overview-default") {
            return (
              <RbacWidget
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant={entity.variant as any}
                data={entity}
              >
                <SubjectOverviewDefault
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                />
              </RbacWidget>
            );
          }

          if (entity.variant === "subjects-list-default") {
            return (
              <RbacWidget
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant={entity.variant as any}
                data={entity}
              >
                <SubjectsListDefault
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                />
              </RbacWidget>
            );
          }

          return (
            <RbacWidget
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </RbacWidget>
  );
}
