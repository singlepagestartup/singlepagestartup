import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { Component as LogotypesToFileStorageWidgets } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/frontend/component";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  const href = saveLanguageContext(
    props.data.url || "",
    props.language,
    internationalization.languages,
  );

  return (
    <Link
      data-module="website-builder"
      data-model="logotype"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
      href={href}
    >
      <LogotypesToFileStorageWidgets
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
              <LogotypesToFileStorageWidgets
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </LogotypesToFileStorageWidgets>
    </Link>
  );
}
