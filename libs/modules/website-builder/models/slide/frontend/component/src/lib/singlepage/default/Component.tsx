import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as SlidesToSpsFileStorageWidgets } from "@sps/website-builder/relations/slides-to-file-storage-module-widgets/frontend/component";
import { Component as SlidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="elements"
      data-variant="default"
      className={cn("w-full flex", props.data.className)}
    >
      <div className="relative min-h-80 w-full flex flex-col items-center justify-center gap-10">
        <div className="absolute inset-0 flex">
          <SlidesToSpsFileStorageWidgets
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slideId",
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
                  <SlidesToSpsFileStorageWidgets
                    key={index}
                    isServer={props.isServer}
                    hostUrl={props.hostUrl}
                    variant={entity.variant as any}
                    data={entity}
                  />
                );
              });
            }}
          </SlidesToSpsFileStorageWidgets>
        </div>
        <div className="flex flex-col gap-12 items-center">
          <div className="relative p-10">
            <h3 className="font-bold text-xl lg:text-4xl relative">
              {props.data.title}
            </h3>
          </div>

          <SlidesToButtonsArrays
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slideId",
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
                  <SlidesToButtonsArrays
                    key={index}
                    isServer={props.isServer}
                    hostUrl={props.hostUrl}
                    variant={entity.variant as any}
                    data={entity}
                  />
                );
              });
            }}
          </SlidesToButtonsArrays>
        </div>
      </div>
    </div>
  );
}
