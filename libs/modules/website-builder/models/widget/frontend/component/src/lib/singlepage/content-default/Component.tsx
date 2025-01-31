import { IComponentPropsExtended } from "./interface";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFileStorageWidgets } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className || "px-2 py-20 lg:py-32",
      )}
    >
      <div className="w-full flex items-start flex-col gap-5 mx-auto max-w-7xl">
        <ClientComponent />
        {props.data?.subtitle ? (
          <h3 className="text-base tracking-tight text-gray-600 sm:text-md md:text-xl max-w-xl">
            {props.data?.subtitle[props.language]}
          </h3>
        ) : null}
        {props.data?.title ? (
          <h1 className="text-4xl font-bold tracking-tight xl:inline text-gray-900 sm:text-5xl md:text-6xl max-w-3xl">
            {props.data?.title[props.language]}
          </h1>
        ) : null}
        {props.data.description?.[props.language] ? (
          <TipTap value={props.data.description[props.language] ?? ""} />
        ) : null}
        <div className="mx-auto my-5 max-w-md flex flex-col sm:flex-row justify-center md:mt-8 gap-4">
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
        {props.children}
        <div className="w-full">
          <WidgetsToFileStorageWidgets
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
                  <WidgetsToFileStorageWidgets
                    key={index}
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    data={entity}
                    language={props.language}
                  />
                );
              });
            }}
          </WidgetsToFileStorageWidgets>
        </div>
      </div>
    </div>
  );
}
