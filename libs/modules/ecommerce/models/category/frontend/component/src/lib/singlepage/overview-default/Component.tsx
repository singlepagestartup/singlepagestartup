import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CategoriesToFileStorageModuleWidgets } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className || "")}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 mb-8">
        <CategoriesToFileStorageModuleWidgets
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "categoryId",
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
                <CategoriesToFileStorageModuleWidgets
                  key={index}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </CategoriesToFileStorageModuleWidgets>
        <p className="font-bold text-center text-4xl">
          {props.data.title?.[props.language]}
        </p>
      </div>
      {props.children}
    </div>
  );
}
