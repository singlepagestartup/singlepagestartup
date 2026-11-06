import type { IComponentPropsExtended } from "./interface";
import { Component as ProfilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
import { getLocalizedPlainText } from "../plain-text";

export function Component(props: IComponentPropsExtended) {
  const name =
    props.data.title?.[props.language] ||
    props.data.title?.en ||
    props.data.slug;
  const small = props.size === "xs";
  const subtitle = getLocalizedPlainText(props.data.subtitle, props.language);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase(props.language);
  return (
    <div
      data-module="social"
      data-model="profile"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "flex min-w-0 items-center gap-2",
        props.data.className,
        props.className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground",
          small ? "size-6" : "size-11",
        )}
      >
        {initials}
        <ProfilesToFileStorageModuleFiles
          isServer={props.isServer}
          variant="find"
          skeleton={null}
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "profileId", method: "eq", value: props.data.id },
                ],
              },
              orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
              limit: 1,
            },
          }}
        >
          {({ data }) =>
            data?.map((link) => (
              <ProfilesToFileStorageModuleFiles
                key={link.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={link}
                language={props.language}
                className="absolute inset-0 [&_[data-model=file]]:size-full [&_img]:size-full [&_img]:object-cover"
              />
            ))
          }
        </ProfilesToFileStorageModuleFiles>
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "break-words font-medium text-foreground",
            small ? "text-xs" : "text-sm",
            props.inverse && "text-default-foreground",
          )}
        >
          {name}
        </p>
        {!small && subtitle ? (
          <p
            className={cn(
              "text-xs leading-5 text-muted-foreground",
              props.inverse && "text-default-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
