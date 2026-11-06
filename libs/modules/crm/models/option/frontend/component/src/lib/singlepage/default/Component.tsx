import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as OptionsToFileStorageModuleWidgets } from "@sps/crm/relations/options-to-file-storage-module-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="option"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex h-full w-full min-w-0 items-center gap-3 text-sm",
        props.data.className,
        props.className,
      )}
    >
      <OptionsToFileStorageModuleWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "optionId",
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
              <div key={entity.id} className="relative h-5 aspect-1 shrink-0">
                <div className="absolute inset-0">
                  <OptionsToFileStorageModuleWidgets
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    data={entity}
                  />
                </div>
              </div>
            );
          });
        }}
      </OptionsToFileStorageModuleWidgets>
      <span>
        {props.data.title?.[props.language] || props.data.title?.en || ""}
      </span>
    </div>
  );
}
