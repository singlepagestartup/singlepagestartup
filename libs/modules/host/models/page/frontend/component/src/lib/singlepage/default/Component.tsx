import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as PagesToLayouts } from "@sps/host/relations/pages-to-layouts/frontend/component";
import { Component as PagesToWidgets } from "@sps/host/relations/pages-to-widgets/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <PagesToLayouts
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "pageId",
                  method: "eq",
                  value: props.data.id,
                },
                {
                  column: "variant",
                  method: "eq",
                  value: "default",
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <PagesToLayouts
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant={entity.variant as any}
                data={entity}
              >
                <PagesToWidgets
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "pageId",
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
                        <PagesToWidgets
                          key={index}
                          isServer={props.isServer}
                          hostUrl={props.hostUrl}
                          variant={entity.variant as any}
                          data={entity}
                        />
                      );
                    });
                  }}
                </PagesToWidgets>
              </PagesToLayouts>
            );
          });
        }}
      </PagesToLayouts>
    </div>
  );
}
