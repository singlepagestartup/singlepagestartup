import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
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
      tabIndex={props.data.anchor ? -1 : undefined}
      aria-labelledby={title ? `${props.data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "@container mx-auto w-full min-w-0 max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16",
        props.data.className,
        props.className,
      )}
    >
      <div className="rounded-3xl bg-default p-6 text-default-foreground @3xl:p-8 @5xl:p-10">
        {subtitle ? (
          <p className="text-sm font-medium text-default-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        {title ? (
          <h2
            id={`${props.data.id}-title`}
            className="mt-3 max-w-2xl text-balance font-default text-3xl font-semibold leading-[1.15] tracking-normal @4xl:text-4xl"
          >
            {title}
          </h2>
        ) : null}
        {description ? (
          <div className="mt-5 text-sm leading-7 text-default-muted-foreground [&_.prose]:text-default-muted-foreground">
            <TipTap value={description} />
          </div>
        ) : null}
        <div className="mt-8 grid gap-6 @3xl:grid-cols-3 [&>[data-relation=widgets-to-features]:has([data-variant=copy-request])]:col-span-full">
          {props.children ?? (
            <WidgetsToFeatures
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
              {({ data: links }) =>
                links
                  ?.toSorted(
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
                      className="block min-w-0"
                    />
                  ))
              }
            </WidgetsToFeatures>
          )}
        </div>
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
          {({ data: links }) =>
            links?.length ? (
              <div className="mt-6 flex flex-wrap gap-4">
                {links
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
                    />
                  ))}
              </div>
            ) : null
          }
        </WidgetsToButtonsArrays>
      </div>
    </section>
  );
}
