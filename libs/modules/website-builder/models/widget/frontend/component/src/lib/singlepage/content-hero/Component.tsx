import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetsToFileStorageModuleFiles } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language] || props.data.title?.en;
  const subtitle =
    props.data.subtitle?.[props.language] || props.data.subtitle?.en;
  const description =
    props.data.description?.[props.language] || props.data.description?.en;
  return (
    <section
      id={props.data.anchor || undefined}
      aria-labelledby={title ? `${props.data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "@container w-full min-w-0 bg-card py-10 @3xl:py-12",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 @3xl:grid-cols-2 @3xl:gap-10 @3xl:px-8">
        <div className="min-w-0 py-2">
          {subtitle ? (
            <p className="inline-flex max-w-full items-center gap-2 text-xs font-medium uppercase tracking-widest text-foreground">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full bg-primary"
              />
              {subtitle}
            </p>
          ) : null}
          {title ? (
            <h1
              id={`${props.data.id}-title`}
              className="mt-5 max-w-2xl text-balance font-default text-4xl font-semibold leading-[1.08] tracking-normal text-foreground @3xl:text-5xl @5xl:text-[62px]"
            >
              {title}
            </h1>
          ) : null}
          {description ? (
            <div className="mt-5 max-w-lg space-y-4 text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground [&_a]:text-foreground">
              <TipTap value={description ?? ""} />
            </div>
          ) : null}
          <WidgetsToButtonsArrays
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "widgetId", method: "eq", value: props.data.id },
                  ],
                },
              },
            }}
          >
            {({ data }) =>
              data?.length ? (
                <div className="mt-7 flex w-full flex-wrap items-center gap-4">
                  {data
                    .toSorted(
                      (a, b) =>
                        a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                    )
                    .map((link) => (
                      <WidgetsToButtonsArrays
                        key={link.id}
                        isServer={props.isServer}
                        variant="default"
                        dataSource="props"
                        data={link}
                        language={props.language}
                        className="w-auto max-w-full"
                      />
                    ))}
                </div>
              ) : null
            }
          </WidgetsToButtonsArrays>
          {props.children}
        </div>
        <div className="min-w-0">
          <WidgetsToFileStorageModuleFiles
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "widgetId", method: "eq", value: props.data.id },
                  ],
                },
              },
            }}
          >
            {({ data }) =>
              data?.length ? (
                <figure className="min-w-0 overflow-hidden rounded-3xl">
                  {data
                    .toSorted(
                      (a, b) =>
                        a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                    )
                    .map((link) => (
                      <WidgetsToFileStorageModuleFiles
                        key={link.id}
                        isServer={props.isServer}
                        variant="default"
                        dataSource="props"
                        data={link}
                        language={props.language}
                        className="block min-w-0 [&_[data-model=file]]:w-full [&_img]:aspect-square [&_img]:h-auto [&_img]:w-full [&_img]:object-cover"
                      />
                    ))}
                </figure>
              ) : null
            }
          </WidgetsToFileStorageModuleFiles>
          <WidgetsToFeatures
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "widgetId", method: "eq", value: props.data.id },
                  ],
                },
              },
            }}
          >
            {({ data }) =>
              data?.length ? (
                <div className="mt-4 space-y-4">
                  {data
                    .toSorted(
                      (a, b) =>
                        a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                    )
                    .map((link) => (
                      <WidgetsToFeatures
                        key={link.id}
                        isServer={props.isServer}
                        variant="default"
                        dataSource="props"
                        data={link}
                        language={props.language}
                        className="w-auto max-w-full"
                      />
                    ))}
                </div>
              ) : null
            }
          </WidgetsToFeatures>
        </div>
      </div>
    </section>
  );
}
