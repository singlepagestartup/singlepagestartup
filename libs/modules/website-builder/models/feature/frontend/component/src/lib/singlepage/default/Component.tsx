import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as FeaturesToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="elements.feature"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("flex flex-col w-full", props.data.className)}
    >
      {props.data.title?.[props.language] ? (
        <p className="text-3xl font-medium leading-6 text-gray-900">
          {props.data.title[props.language]}
        </p>
      ) : null}
      {props.data?.description?.[props.language] ? (
        <p className="text-base text-gray-500">
          {props.data?.description[props.language]}
        </p>
      ) : null}
      <FeaturesToFileStorageModuleFiles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "featureId", method: "eq", value: props.data.id },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <FeaturesToFileStorageModuleFiles
                key={index}
                isServer={props.isServer}
                data={entity}
                variant={entity.variant as any}
                language={props.language}
              />
            );
          });
        }}
      </FeaturesToFileStorageModuleFiles>
    </div>
  );
}
