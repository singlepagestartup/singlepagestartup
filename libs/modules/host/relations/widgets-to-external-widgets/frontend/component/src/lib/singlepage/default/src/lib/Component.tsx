import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SpsWebsiteBuilder } from "@sps/website-builder/models/widget/frontend/component";
import { Component as Startup } from "@sps/startup/models/widget/frontend/component";
import { Component as SpsRbacWidget } from "@sps/rbac/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-relation="widgets-to-external-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className || "")}
    >
      {props.data.externalModule === "website-builder" ? (
        <SpsWebsiteBuilder
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
            return data?.map((widget) => {
              return (
                <SpsWebsiteBuilder
                  key={widget.id}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  data={widget}
                  variant={widget.variant as any}
                />
              );
            });
          }}
        </SpsWebsiteBuilder>
      ) : null}
      {props.data.externalModule === "startup" ? (
        <Startup
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
                <Startup
                  key={index}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </Startup>
      ) : null}
      {props.data.externalModule === "rbac" ? (
        <SpsRbacWidget
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
                <SpsRbacWidget
                  key={index}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </SpsRbacWidget>
      ) : null}
    </div>
  );
}
