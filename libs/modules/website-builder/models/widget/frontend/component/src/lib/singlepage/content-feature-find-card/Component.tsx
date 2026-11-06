import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language],
    subtitle = props.data.subtitle?.[props.language],
    description = props.data.description?.[props.language];
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full bg-muted py-12 sm:py-16",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl sm:mb-10">
          {subtitle ? (
            <p className="mb-2 text-sm font-semibold tracking-normal text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
          {title ? (
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal text-foreground sm:text-[2.5rem]">
              {title}
            </h2>
          ) : null}
          {description ? (
            <div className="mt-3 text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground">
              <TipTap value={description} />
            </div>
          ) : null}
        </header>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data
                  .toSorted(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                  )
                  .map((link) => (
                    <WidgetsToFeatures
                      key={link.id}
                      isServer={props.isServer}
                      variant={link.variant as any}
                      dataSource="props"
                      data={link}
                      language={props.language}
                      className="h-full min-w-0"
                    />
                  ))}
              </div>
            ) : null
          }
        </WidgetsToFeatures>
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
              <div className="mt-8 flex flex-wrap gap-3">
                {data
                  .toSorted(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
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
    </section>
  );
}
