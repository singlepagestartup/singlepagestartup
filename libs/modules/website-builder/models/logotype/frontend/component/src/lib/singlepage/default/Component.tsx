import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { Component as LogotypesToSpsFileStorageWidgets } from "@sps/website-builder/relations/logotypes-to-file-storage-module-widgets/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="logotype"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={`relative ${props.data.className || "w-full"}`}
    >
      <Link
        href={props.data.url || "/"}
        className="flex items-center justify-center"
      >
        <LogotypesToSpsFileStorageWidgets
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "logotypeId",
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
                <LogotypesToSpsFileStorageWidgets
                  key={index}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </LogotypesToSpsFileStorageWidgets>
      </Link>
    </div>
  );
}
