import type { IComponentPropsExtended } from "./interface";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetsToFileStorageModuleFiles } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToSliders } from "@sps/website-builder/relations/widgets-to-sliders/frontend/component";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language];
  const description = props.data.description?.[props.language];
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full py-8 sm:py-12",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-8 px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-5 overflow-hidden rounded-3xl bg-default p-6 text-default-foreground sm:p-10 lg:p-12">
          {props.data.subtitle?.[props.language] ? (
            <p className="text-sm font-medium text-default-muted-foreground">
              {props.data.subtitle[props.language]}
            </p>
          ) : null}
          {title ? (
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
          ) : null}
          {description ? (
            <div className="max-w-3xl text-base leading-7 text-default-muted-foreground [&_.prose]:text-default-muted-foreground [&_a]:text-primary">
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
                    { column: "widgetId", method: "eq", value: props.data.id },
                  ],
                },
              },
            }}
          >
            {({ data }) =>
              data?.length ? (
                <div className="flex flex-wrap gap-3">
                  {data
                    .toSorted((a, b) => a.orderIndex - b.orderIndex)
                    .map((entity) => (
                      <WidgetsToButtonsArrays
                        key={entity.id}
                        isServer={props.isServer}
                        variant={entity.variant as any}
                        data={entity}
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
              <div className="grid min-w-0 gap-5 overflow-hidden rounded-3xl [&_img]:w-full [&_img]:rounded-2xl [&_video]:w-full">
                {data
                  .toSorted((a, b) => a.orderIndex - b.orderIndex)
                  .map((entity) => (
                    <WidgetsToFileStorageModuleFiles
                      key={entity.id}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                      language={props.language}
                    />
                  ))}
              </div>
            ) : null
          }
        </WidgetsToFileStorageModuleFiles>
        <WidgetsToSliders
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
              <div className="space-y-8">
                {data
                  .toSorted((a, b) => a.orderIndex - b.orderIndex)
                  .map((entity) => (
                    <WidgetsToSliders
                      key={entity.id}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                      language={props.language}
                    />
                  ))}
              </div>
            ) : null
          }
        </WidgetsToSliders>
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
              <div className="grid gap-6 md:grid-cols-2">
                {data
                  .toSorted((a, b) => a.orderIndex - b.orderIndex)
                  .map((entity) => (
                    <WidgetsToFeatures
                      key={entity.id}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                      language={props.language}
                    />
                  ))}
              </div>
            ) : null
          }
        </WidgetsToFeatures>
      </div>
    </section>
  );
}
