import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FeaturesToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language],
    subtitle = props.data.subtitle?.[props.language],
    description = props.data.description?.[props.language];
  return (
    <article
      data-module="website-builder"
      data-model="feature"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "flex h-full w-full min-w-0 flex-col rounded-2xl border border-border bg-card p-6 sm:p-8",
        props.data.className,
        props.className,
      )}
    >
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
        {({ data }) =>
          data?.length ? (
            <div className="mb-6 flex flex-wrap gap-3">
              {data
                .toSorted(
                  (a, b) =>
                    a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                )
                .map((link) => (
                  <FeaturesToFileStorageModuleFiles
                    key={link.id}
                    isServer={props.isServer}
                    variant={link.variant as any}
                    dataSource="props"
                    data={link}
                    language={props.language}
                    className="size-12 shrink-0 items-center justify-center rounded-xl bg-muted p-3 text-foreground [&_[data-model=file]]:size-6 [&_img]:object-contain"
                  />
                ))}
            </div>
          ) : null
        }
      </FeaturesToFileStorageModuleFiles>
      {subtitle ? (
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
      {title ? (
        <h3 className="text-xl font-semibold leading-7 tracking-normal text-foreground">
          {title}
        </h3>
      ) : null}
      {description ? (
        <div className="mt-3 text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground">
          <TipTap value={description} />
        </div>
      ) : null}
      <FeaturesToButtonsArrays
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
        {({ data }) =>
          data?.length ? (
            <div className="mt-auto pt-6">
              {data
                .toSorted(
                  (a, b) =>
                    a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                )
                .map((link) => (
                  <FeaturesToButtonsArrays
                    key={link.id}
                    isServer={props.isServer}
                    variant={link.variant as any}
                    dataSource="props"
                    data={link}
                    language={props.language}
                  />
                ))}
            </div>
          ) : null
        }
      </FeaturesToButtonsArrays>
      {props.children}
    </article>
  );
}
