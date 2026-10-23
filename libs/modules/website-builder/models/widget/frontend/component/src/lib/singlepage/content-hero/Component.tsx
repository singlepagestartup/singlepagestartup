import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetsToFileStorageModuleFiles } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language];
  const subtitle = props.data.subtitle?.[props.language];
  const description = props.data.description?.[props.language];
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full bg-muted py-8 sm:py-12",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-hidden rounded-3xl bg-default lg:flex-row flex-col">
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center p-6 sm:p-10 lg:p-12">
            {subtitle ? (
              <p className="mb-6 inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium leading-5 text-foreground">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full bg-primary"
                />
                {subtitle}
              </p>
            ) : null}
            {title ? (
              <h1 className="max-w-[14ch] text-[2.5rem] font-semibold leading-[1.08] tracking-normal text-default-foreground sm:text-5xl xl:text-[4rem]">
                {title}
              </h1>
            ) : null}
            {description ? (
              <div className="mt-6 max-w-lg text-base leading-7 text-default-muted-foreground sm:text-lg sm:leading-8 [&_.prose]:text-default-muted-foreground [&_a]:text-primary">
                <TipTap value={description} />
              </div>
            ) : null}
            <WidgetsToButtonsArrays
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "widgetId",
                        method: "eq",
                        value: props.data.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) =>
                data?.length ? (
                  <div className="mt-8 flex w-full flex-wrap items-center gap-3 [&_a]:focus-visible:outline-card">
                    {data
                      .toSorted(
                        (a, b) =>
                          a.orderIndex - b.orderIndex ||
                          a.id.localeCompare(b.id),
                      )
                      .map((link) => (
                        <WidgetsToButtonsArrays
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
            </WidgetsToButtonsArrays>
            {props.children}
          </div>
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
                <div className="grid min-w-0 flex-1 bg-card lg:min-h-[36rem]">
                  {data
                    .toSorted(
                      (a, b) =>
                        a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                    )
                    .map((link) => (
                      <WidgetsToFileStorageModuleFiles
                        key={link.id}
                        isServer={props.isServer}
                        variant={link.variant as any}
                        dataSource="props"
                        data={link}
                        language={props.language}
                        className="min-h-0 [&_[data-model=file]]:h-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
                      />
                    ))}
                </div>
              ) : null
            }
          </WidgetsToFileStorageModuleFiles>
        </div>
      </div>
    </section>
  );
}
