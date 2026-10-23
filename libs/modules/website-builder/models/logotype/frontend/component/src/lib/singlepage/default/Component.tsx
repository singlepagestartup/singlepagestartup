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

  const title = props.data.title?.[props.language];

  return (
    <Link
      data-module="website-builder"
      data-model="logotype"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "inline-flex min-h-11 max-w-full items-center gap-3 rounded-xl text-base font-semibold text-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        props.data.className,
        props.className,
      )}
      href={href}
      aria-label={title || undefined}
    >
      <span className="inline-flex shrink-0 items-center [&_[data-relation=logotypes-to-file-storage-module-files]]:size-8 [&_[data-model=file]]:size-8 [&_img]:object-contain">
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
            return data
              ?.toSorted(
                (a, b) =>
                  a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
              )
              .map((entity) => {
                return (
                  <LogotypesToFileStorageWidgets
                    key={entity.id}
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    dataSource="props"
                    data={entity}
                    language={props.language}
                  />
                );
              });
          }}
        </LogotypesToFileStorageWidgets>
      </span>
      {title ? (
        <span className="hidden min-[480px]:inline">{title}</span>
      ) : null}
    </Link>
  );
}
