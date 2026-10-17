import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Layout } from "@sps/host/models/layout/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-relation="pages-to-layouts"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Layout
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.layoutId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity) => {
            return (
              <Layout
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
                before={props.before}
                after={props.after}
              >
                {props.children}
              </Layout>
            );
          });
        }}
      </Layout>
    </div>
  );
}
