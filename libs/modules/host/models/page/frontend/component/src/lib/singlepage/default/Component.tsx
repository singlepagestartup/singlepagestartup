import { IComponentPropsExtended, ILayoutWidgetsProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as PagesToLayouts } from "@sps/host/relations/pages-to-layouts/frontend/component";
import { Component as PagesToWidgets } from "@sps/host/relations/pages-to-widgets/frontend/component";
import { Component as LayoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/frontend/component";
import { Component as Widget } from "@sps/host/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <PagesToLayouts
        isServer={props.isServer}
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
          return data?.map((entity) => {
            return (
              <PagesToLayouts
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
                before={
                  <LayoutWidgets
                    isServer={props.isServer}
                    language={props.language}
                    url={props.url}
                    layoutId={entity.layoutId}
                    slot="default"
                  />
                }
                after={
                  <LayoutWidgets
                    isServer={props.isServer}
                    language={props.language}
                    url={props.url}
                    layoutId={entity.layoutId}
                    slot="additional"
                  />
                }
              >
                <PagesToWidgets
                  isServer={props.isServer}
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
                    return data?.map((entity) => {
                      return (
                        <PagesToWidgets
                          key={entity.id}
                          isServer={props.isServer}
                          variant={entity.variant as any}
                          data={entity}
                          url={props.url}
                          language={props.language}
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

function LayoutWidgets(props: ILayoutWidgetsProps) {
  return (
    <LayoutsToWidgets
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "layoutId", method: "eq", value: props.layoutId },
              { column: "variant", method: "eq", value: props.slot },
            ],
          },
        },
      }}
    >
      {({ data }) =>
        data?.map((link) => (
          <LayoutsToWidgets
            key={link.id}
            isServer={props.isServer}
            variant="default"
            data={link}
            language={props.language}
          >
            <Widget
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [{ column: "id", method: "eq", value: link.widgetId }],
                  },
                },
              }}
            >
              {({ data: widgets }) =>
                widgets?.map((widget) => (
                  <Widget
                    key={widget.id}
                    isServer={props.isServer}
                    variant={widget.variant as any}
                    data={widget}
                    language={props.language}
                    url={props.url}
                  />
                ))
              }
            </Widget>
          </LayoutsToWidgets>
        ))
      }
    </LayoutsToWidgets>
  );
}
